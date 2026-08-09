#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="jgudel-ctrl/ai-coding-starter-kit"
BRANCH="main"
ENVIRONMENT="workflow-approval"
ACTIONS_APP_ID="15368"
REVIEWER_LOGIN="jgudel-ctrl"

git_root="$(git rev-parse --show-toplevel)"
cd "$git_root"

origin_url="$(git remote get-url origin)"
case "$origin_url" in
  git@github.com:jgudel-ctrl/ai-coding-starter-kit.git|https://github.com/jgudel-ctrl/ai-coding-starter-kit.git) ;;
  *) printf 'Unexpected origin: %s\n' "$origin_url" >&2; exit 1 ;;
esac

[[ "$(git branch --show-current)" == "$BRANCH" ]]
git fetch origin "$BRANCH"
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/$BRANCH)" ]]
[[ -z "$(git status --porcelain=v2 --untracked-files=all)" ]]
trusted_artifacts=(
  .github/scripts/configure_trusted_protection.sh
  .github/scripts/trusted_workflow_gate.py
  .github/scripts/test_trusted_workflow_gate.py
  .github/workflows/trusted-workflow-gate.yml
  .github/workflows/workflow-gates.yml
)
for artifact in "${trusted_artifacts[@]}"; do
  [[ -f "$artifact" ]]
  [[ "$(git hash-object "$artifact")" == "$(git rev-parse "HEAD:$artifact")" ]]
done

reviewer_id="$(gh api "/users/$REVIEWER_LOGIN" --jq .id)"
[[ "$reviewer_id" =~ ^[0-9]+$ ]]

environment_payload="$(python3 - "$reviewer_id" <<'PY'
import json, sys
print(json.dumps({
    "wait_timer": 0,
    "prevent_self_review": False,
    "reviewers": [{"type": "User", "id": int(sys.argv[1])}],
    "deployment_branch_policy": {
        "protected_branches": True,
        "custom_branch_policies": False,
    },
}))
PY
)"
printf '%s' "$environment_payload" | gh api \
  --method PUT "/repos/$REPOSITORY/environments/$ENVIRONMENT" \
  --input - >/dev/null

protection_payload="$(python3 - "$ACTIONS_APP_ID" <<'PY'
import json, sys
app_id = int(sys.argv[1])
print(json.dumps({
    "required_status_checks": {
        "strict": True,
        "checks": [
            {"context": "Trusted Workflow Gate", "app_id": app_id},
            {"context": "Workflow Gate", "app_id": app_id},
        ],
    },
    "enforce_admins": True,
    "required_pull_request_reviews": None,
    "restrictions": None,
    "required_linear_history": False,
    "allow_force_pushes": False,
    "allow_deletions": False,
    "block_creations": False,
    "required_conversation_resolution": True,
    "lock_branch": False,
    "allow_fork_syncing": False,
}))
PY
)"
printf '%s' "$protection_payload" | gh api \
  --method PUT "/repos/$REPOSITORY/branches/$BRANCH/protection" \
  --input - >/dev/null

environment_json="$(gh api "/repos/$REPOSITORY/environments/$ENVIRONMENT")"
protection_json="$(gh api "/repos/$REPOSITORY/branches/$BRANCH/protection")"
python3 - "$REVIEWER_LOGIN" "$ACTIONS_APP_ID" "$environment_json" "$protection_json" <<'PY'
import json, sys
reviewer, app_id, environment_raw, protection_raw = sys.argv[1:]
environment = json.loads(environment_raw)
protection = json.loads(protection_raw)
rules = environment.get("protection_rules", [])
review_rule = next((rule for rule in rules if rule.get("type") == "required_reviewers"), None)
wait_rules = [rule for rule in rules if rule.get("type") == "wait_timer"]
branch_rule = next((rule for rule in rules if rule.get("type") == "branch_policy"), None)
assert review_rule is not None
# GitHub omits the wait_timer rule when the configured value is zero.
assert not wait_rules or all(rule.get("wait_timer") == 0 for rule in wait_rules)
assert branch_rule is not None
assert environment.get("deployment_branch_policy") == {
    "protected_branches": True,
    "custom_branch_policies": False,
}
assert review_rule.get("prevent_self_review") is False
reviewers = {
    item.get("reviewer", {}).get("login")
    for item in review_rule.get("reviewers", [])
}
assert reviewers == {reviewer}
status = protection["required_status_checks"]
assert status["strict"] is True
checks = {(item["context"], str(item.get("app_id"))) for item in status["checks"]}
assert checks == {
    ("Trusted Workflow Gate", app_id),
    ("Workflow Gate", app_id),
}
assert protection["enforce_admins"]["enabled"] is True
assert protection["required_conversation_resolution"]["enabled"] is True
assert protection["allow_force_pushes"]["enabled"] is False
assert protection["allow_deletions"]["enabled"] is False
assert protection["required_linear_history"]["enabled"] is False
assert protection["block_creations"]["enabled"] is False
assert protection["lock_branch"]["enabled"] is False
assert protection["allow_fork_syncing"]["enabled"] is False
print("Trusted GitHub environment and strict branch protection verified.")
PY
