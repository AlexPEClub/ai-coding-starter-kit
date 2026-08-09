#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import os
import re
import subprocess
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("trusted_workflow_gate.py")
spec = importlib.util.spec_from_file_location("trusted_workflow_gate", MODULE_PATH)
assert spec and spec.loader
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


class TrustedWorkflowGateTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp.name) / "repo"
        self.repo.mkdir()
        self.git("init", "-b", "main")
        self.git("config", "user.email", "ci@example.invalid")
        self.git("config", "user.name", "Trusted CI")
        (self.repo / "features").mkdir()
        self.write_state("Roadmap", "Pending", "Pending")
        self.git("add", ".")
        self.git("commit", "-m", "docs(PROJ-46): baseline")
        self.base = self.git("rev-parse", "HEAD").strip()
        self.git("switch", "-c", "feat/PROJ-46-test")

    def tearDown(self):
        self.temp.cleanup()

    def git(self, *args: str) -> str:
        return subprocess.run(
            ["git", *args], cwd=self.repo, check=True, capture_output=True, text=True
        ).stdout

    def write_state(self, status: str, spec: str, architecture: str) -> None:
        (self.repo / "features" / "PROJ-46-test.md").write_text(
            f"""# PROJ-46: Test

## Status: {status}
**Spec Approval:** {spec}
**Architecture Approval:** {architecture}
**QA Status:** Pending
**Unresolved Critical:** None
**Unresolved High:** None
**Hotfix:** No
**Deploy Required:** No
**Production Deploy Approval:** Not Approved

## Dependencies
- Test fixture
""",
            encoding="utf-8",
        )
        marker = {
            "Roadmap": "🔵",
            "Planned": "🔵",
            "Architected": "🟣",
            "In Progress": "🟡",
            "In Review": "🟠",
            "Approved": "✅",
            "Deployed": "✅",
        }[status]
        (self.repo / "features" / "INDEX.md").write_text(
            "# Feature Index\n\n"
            "## Next Available ID: PROJ-47\n\n"
            "## Features\n\n"
            "| ID | Feature | Status | Date |\n"
            "|---|---|---|---|\n"
            "| PROJ-45 | Existing | ✅ Deployed — stable | 2026-08-08 |\n"
            f"| PROJ-46 | Test | {marker} {status} — candidate | 2026-08-09 |\n"
            "\nFooter metadata.\n",
            encoding="utf-8",
        )

    def commit_tree_with_subject(self, subject: str) -> str:
        self.git("add", "-A")
        tree = self.git("write-tree").strip()
        raw_commit = (
            f"tree {tree}\n"
            f"parent {self.base}\n"
            "author Test <test@example.com> 0 +0000\n"
            "committer Test <test@example.com> 0 +0000\n\n"
            f"{subject}\n"
        )
        result = subprocess.run(
            ["git", "hash-object", "-t", "commit", "-w", "--stdin"],
            cwd=self.repo,
            input=raw_commit,
            text=True,
            check=True,
            capture_output=True,
        )
        head = result.stdout.strip()
        self.git("reset", "--hard", head)
        return head

    def commit_head(self, message: str = "feat(PROJ-46): candidate") -> str:
        self.git("add", "-A")
        self.git("commit", "-m", message)
        return self.git("rev-parse", "HEAD").strip()

    def approve_with_code(self) -> str:
        self.write_state("Architected", "Approved", "Approved")
        (self.repo / "src").mkdir(exist_ok=True)
        (self.repo / "src" / "ok.ts").write_text("ok", encoding="utf-8")
        return self.commit_head()

    def test_repository_index_uses_exact_supported_grammar(self):
        root = Path(__file__).resolve().parents[2]
        text = (root / "features" / "INDEX.md").read_text(encoding="utf-8")
        rows = policy.index_rows(text)
        self.assertEqual(rows["PROJ-45"][0], "Deployed")
        self.assertEqual(policy.next_available_id(text), "PROJ-46")
        workflow = (root / ".github/workflows/trusted-workflow-gate.yml").read_text()
        self.assertIn("python3 trusted/.github/scripts/test_trusted_workflow_gate.py", workflow)
        self.assertNotIn("python3 -m unittest -v trusted/", workflow)
        self.assertNotIn("actions/checkout@", workflow)
        self.assertNotIn("http.extraheader", workflow)
        self.assertIn("username=x-access-token", workflow)
        self.assertIn("password=$GH_FETCH_TOKEN", workflow)
        normal_workflow = (root / ".github/workflows/workflow-gates.yml").read_text()
        self.assertNotIn("actions/checkout@", normal_workflow)
        self.assertNotIn("http.extraheader", normal_workflow)
        self.assertIn("username=x-access-token", normal_workflow)
        self.assertIn("password=$GH_FETCH_TOKEN", normal_workflow)
        self.assertIn("github.event.pull_request.head.repo.full_name", normal_workflow)
        self.assertIn("github.event.pull_request.base.repo.full_name", normal_workflow)
        self.assertIn('git remote add candidate "https://github.com/${HEAD_REPOSITORY}.git"', normal_workflow)
        self.assertIn('git remote add base "https://github.com/${BASE_REPOSITORY}.git"', normal_workflow)
        self.assertIn("base_count == 0 && head_count == 0", normal_workflow)
        self.assertIn("head_count == ${#required_paths[@]}", normal_workflow)
        self.assertIn("Hermes workflow implementation is partial or was removed", normal_workflow)
        configurator = (root / ".github/scripts/configure_trusted_protection.sh").read_text()
        self.assertIn('REVIEWER_LOGIN="jgudel-ctrl"', configurator)
        self.assertNotIn('REVIEWER_LOGIN="${1', configurator)
        self.assertIn("assert reviewers == {reviewer}", configurator)
        self.assertIn("git status --porcelain=v2 --untracked-files=all", configurator)
        self.assertIn('git hash-object "$artifact"', configurator)
        self.assertIn('git rev-parse "HEAD:$artifact"', configurator)
        self.assertIn('wait_rule.get("wait_timer") == 0', configurator)

    def test_valid_approved_protected_change_passes(self):
        head = self.approve_with_code()
        policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_unrelated_feature_spec_and_full_index_row_are_rejected(self):
        self.write_state("Architected", "Approved", "Approved")
        foreign = self.repo / "features" / "PROJ-45-other.md"
        foreign.write_text("# PROJ-45: Other\n\n## Status: Approved\n", encoding="utf-8")
        head = self.commit_head("docs(PROJ-46): alter unrelated spec")
        with self.assertRaisesRegex(policy.PolicyError, "outside the active feature"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")
        self.git("reset", "--hard", self.base)
        index = self.repo / "features" / "INDEX.md"
        text = index.read_text(encoding="utf-8").replace("stable", "tampered")
        index.write_text(text, encoding="utf-8")
        head = self.commit_head("docs(PROJ-46): alter unrelated row")
        with self.assertRaisesRegex(policy.PolicyError, "unrelated INDEX"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_unrelated_global_index_text_is_rejected(self):
        self.write_state("Architected", "Approved", "Approved")
        index = self.repo / "features" / "INDEX.md"
        index.write_text(index.read_text(encoding="utf-8") + "\nForged workflow rule.\n", encoding="utf-8")
        head = self.commit_head("docs(PROJ-46): alter index metadata")
        with self.assertRaisesRegex(policy.PolicyError, "workflow metadata"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_newline_paths_and_duplicate_spec_are_rejected(self):
        (self.repo / "src").mkdir()
        path = self.repo / "src" / "evil\nname.ts"
        path.write_text("blocked", encoding="utf-8")
        head = self.commit_head()
        self.assertIn("src/evil\nname.ts", policy.changed_paths(self.repo, self.base, head))
        with self.assertRaisesRegex(policy.PolicyError, "Spec Approval"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")
        self.git("reset", "--hard", self.base)
        self.write_state("Architected", "Approved", "Approved")
        duplicate = self.repo / "features" / "PROJ-46-decoy\ncopy.md"
        duplicate.write_text(
            "# PROJ-46: Duplicate\n\n## Status: Architected\n"
            "**Spec Approval:** Approved\n**Architecture Approval:** Approved\n",
            encoding="utf-8",
        )
        head = self.commit_head("docs(PROJ-46): add duplicate")
        with self.assertRaisesRegex(policy.PolicyError, "outside the active feature"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")
        for name in ("PROJ-46.md", "PROJ-46_other.md"):
            with self.subTest(name=name):
                self.git("reset", "--hard", self.base)
                self.write_state("Architected", "Approved", "Approved")
                invalid = self.repo / "features" / name
                invalid.write_text(
                    "# PROJ-46: Conflicting\n\n## Status: Roadmap\n"
                    "**Spec Approval:** Pending\n**Architecture Approval:** Pending\n",
                    encoding="utf-8",
                )
                head = self.commit_head("docs(PROJ-46): add conflicting spec")
                with self.assertRaisesRegex(policy.PolicyError, "outside the active feature"):
                    policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_neutral_paths_cannot_hide_feature_headings(self):
        for content in (
            "# PROJ-46: Hidden duplicate\n",
            "# PROJ-46 — Hidden duplicate\n",
            "# PROJ-45 — Hidden unrelated spec\n",
            "<h1>PROJ-45: Hidden unrelated spec</h1>\n",
        ):
            with self.subTest(content=content):
                self.git("reset", "--hard", self.base)
                self.write_state("Architected", "Approved", "Approved")
                (self.repo / "features" / "notes.md").write_text(
                    content, encoding="utf-8"
                )
                head = self.commit_head("docs(PROJ-46): add hidden feature heading")
                with self.assertRaisesRegex(policy.PolicyError, "outside the active feature"):
                    policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_non_markdown_feature_boundary_path_is_rejected(self):
        self.write_state("Architected", "Approved", "Approved")
        (self.repo / "features" / "PROJ-46_conflict.txt").write_text(
            "# PROJ-46: Conflict\n", encoding="utf-8"
        )
        head = self.commit_head("docs(PROJ-46): add conflicting text spec")
        with self.assertRaisesRegex(policy.PolicyError, "outside the active feature"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_index_metadata_line_endings_are_byte_exact(self):
        self.write_state("Architected", "Approved", "Approved")
        index = self.repo / "features" / "INDEX.md"
        raw = index.read_bytes()
        index.write_bytes(raw.replace(b"\n", b"\r\n"))
        head = self.commit_head("docs(PROJ-46): rewrite index line endings")
        with self.assertRaisesRegex(policy.PolicyError, "INDEX bytes|Next Available ID"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")
        self.git("reset", "--hard", self.base)
        self.write_state("Architected", "Approved", "Approved")
        index = self.repo / "features" / "INDEX.md"
        index.write_bytes(index.read_bytes().removesuffix(b"\n"))
        head = self.commit_head("docs(PROJ-46): remove index terminal newline")
        with self.assertRaisesRegex(policy.PolicyError, "INDEX bytes|Next Available ID"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")
        self.git("reset", "--hard", self.base)
        self.write_state("Architected", "Approved", "Approved")
        index = self.repo / "features" / "INDEX.md"
        index.write_text(
            index.read_text(encoding="utf-8").replace(
                "## Next Available ID: PROJ-47",
                "## Next Available ID:\tPROJ-47  ",
            ),
            encoding="utf-8",
        )
        head = self.commit_head("docs(PROJ-46): alter next id whitespace")
        with self.assertRaisesRegex(policy.PolicyError, "Next Available ID|INDEX bytes"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_hidden_top_metadata_cannot_authorize_feature(self):
        attacks = (
            "```markdown\n## Status: Architected\n"
            "**Spec Approval:** Approved\n"
            "**Architecture Approval:** Approved\n```",
            "<!--\n## Status: Architected\n"
            "**Spec Approval:** Approved\n"
            "**Architecture Approval:** Approved\n-->",
        )
        for hidden in attacks:
            with self.subTest(hidden=hidden.splitlines()[0]):
                self.git("reset", "--hard", self.base)
                self.write_state("Architected", "Approved", "Approved")
                spec = self.repo / "features" / "PROJ-46-test.md"
                spec.write_text(
                    "# PROJ-46: Test\n\n"
                    + hidden
                    + "\n\n## Dependencies\n- fixture\n",
                    encoding="utf-8",
                )
                head = self.commit_head("docs(PROJ-46): hide approval metadata")
                with self.assertRaisesRegex(policy.PolicyError, "visible Status|hidden"):
                    policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_unicode_line_separator_metadata_is_rejected(self):
        self.write_state("Architected", "Approved", "Approved")
        spec = self.repo / "features" / "PROJ-46-test.md"
        spec.write_text(
            "# PROJ-46: Test\u2028\u2028## Status: Architected\u2028"
            "**Spec Approval:** Approved\u2028"
            "**Architecture Approval:** Approved\u2028\u2028"
            "## Dependencies\u2028- fixture\u2028",
            encoding="utf-8",
        )
        head = self.commit_head("docs(PROJ-46): use unicode separators")
        with self.assertRaisesRegex(policy.PolicyError, "non-canonical line separator"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_duplicate_markdown_or_html_h1_is_rejected(self):
        additions = (
            "\n# PROJ-46: Duplicate\n",
            "\n<h1>PROJ-46: Duplicate</h1>\n",
        )
        for addition in additions:
            with self.subTest(addition=addition.strip()):
                self.git("reset", "--hard", self.base)
                self.write_state("Architected", "Approved", "Approved")
                spec = self.repo / "features" / "PROJ-46-test.md"
                spec.write_text(spec.read_text(encoding="utf-8") + addition, encoding="utf-8")
                head = self.commit_head("docs(PROJ-46): duplicate visible heading")
                with self.assertRaisesRegex(policy.PolicyError, "headed spec|Raw HTML"):
                    policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_feature_specs_and_architecture_must_be_regular_blobs(self):
        for path, blob_text in (
            (
                "features/PROJ-46-test.md",
                "# PROJ-46: Forged\n\n## Status: Architected\n"
                "**Spec Approval:** Approved\n**Architecture Approval:** Approved\n\n"
                "## Dependencies\n- forged\n",
            ),
            ("features/PROJ-46-architektur.md", "../../outside.md"),
        ):
            with self.subTest(path=path):
                self.git("reset", "--hard", self.base)
                self.write_state("Architected", "Approved", "Approved")
                blob = subprocess.run(
                    ["git", "hash-object", "-w", "--stdin"],
                    cwd=self.repo,
                    input=blob_text,
                    text=True,
                    check=True,
                    capture_output=True,
                ).stdout.strip()
                self.git("update-index", "--add", "--cacheinfo", f"120000,{blob},{path}")
                tree = self.git("write-tree").strip()
                head = subprocess.run(
                    ["git", "commit-tree", tree, "-p", self.base],
                    cwd=self.repo,
                    input="docs(PROJ-46): add symlink state\n\n",
                    text=True,
                    check=True,
                    capture_output=True,
                ).stdout.strip()
                self.git("reset", "--hard", head)
                with self.assertRaisesRegex(policy.PolicyError, "ordinary 100644 blob"):
                    policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_alternate_heading_duplicate_spec_is_rejected(self):
        self.write_state("Architected", "Approved", "Approved")
        (self.repo / "features" / "PROJ-46-decoy.md").write_text(
            "# PROJ-46 — Decoy\n\n## Status: Roadmap\n",
            encoding="utf-8",
        )
        head = self.commit_head("docs(PROJ-46): add alternate decoy")
        with self.assertRaisesRegex(policy.PolicyError, "canonical spec path"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_raw_commit_subject_whitespace_is_rejected(self):
        for subject in (
            " feat(PROJ-46): leading whitespace",
            "feat(PROJ-46): trailing whitespace ",
            "feat(PROJ-46): tab\tinside",
            "feat(PROJ-46): nonbreaking\u00a0space",
            "feat(PROJ-46): unicode\u2028separator",
        ):
            with self.subTest(subject=repr(subject)):
                self.git("reset", "--hard", self.base)
                self.write_state("Architected", "Approved", "Approved")
                (self.repo / "src").mkdir(exist_ok=True)
                (self.repo / "src" / "subject.ts").write_text("ok", encoding="utf-8")
                head = self.commit_tree_with_subject(subject)
                with self.assertRaisesRegex(
                    policy.PolicyError, "Invalid commit subject|subject whitespace"
                ):
                    policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_exact_new_feature_index_transition_passes_but_metadata_does_not(self):
        self.git("switch", "main")
        (self.repo / "features" / "PROJ-46-test.md").unlink()
        index = self.repo / "features" / "INDEX.md"
        text = index.read_text(encoding="utf-8")
        text = re.sub(r"(?m)^\| PROJ-46 .+\n", "", text)
        text = text.replace("## Next Available ID: PROJ-47", "## Next Available ID: PROJ-46")
        index.write_text(text, encoding="utf-8")
        self.git("add", "-A")
        self.git("commit", "-m", "docs(PROJ-45): prepare next feature")
        base = self.git("rev-parse", "HEAD").strip()
        self.git("switch", "-c", "feat/PROJ-46-new")
        self.write_state("Architected", "Approved", "Approved")
        head = self.commit_head("feat(PROJ-46): add exact feature state")
        policy.validate(self.repo, base, head, "feat/PROJ-46-new")
        self.git("reset", "--hard", base)
        self.write_state("Architected", "Approved", "Approved")
        index = self.repo / "features" / "INDEX.md"
        index.write_text(
            index.read_text(encoding="utf-8") + "\nAttacker workflow metadata.\n",
            encoding="utf-8",
        )
        head = self.commit_head("feat(PROJ-46): alter metadata")
        with self.assertRaisesRegex(policy.PolicyError, "workflow metadata"):
            policy.validate(self.repo, base, head, "feat/PROJ-46-new")

    def test_git_type_change_is_included_and_gated(self):
        (self.repo / "src").mkdir()
        tracked = self.repo / "src" / "gate.ts"
        tracked.write_text("regular", encoding="utf-8")
        self.git("add", "src/gate.ts")
        self.git("commit", "-m", "test(PROJ-46): add regular file")
        base = self.git("rev-parse", "HEAD").strip()
        tracked.unlink()
        os.symlink("../features/INDEX.md", tracked)
        head = self.commit_head("test(PROJ-46): change file type")
        self.assertIn("src/gate.ts", policy.changed_paths(self.repo, base, head))
        with self.assertRaisesRegex(policy.PolicyError, "Spec Approval"):
            policy.validate(self.repo, base, head, "feat/PROJ-46-test")

    def test_every_workflow_and_trusted_script_change_is_rejected(self):
        for relative in (
            ".github/workflows/trusted-workflow-gate.yml",
            ".github/workflows/colliding-check.yml",
            ".github/scripts/trusted_workflow_gate.py",
        ):
            with self.subTest(path=relative):
                self.git("reset", "--hard", self.base)
                path = self.repo / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("name: bypass\n", encoding="utf-8")
                head = self.commit_head("chore(PROJ-46): modify workflow policy")
                with self.assertRaisesRegex(policy.PolicyError, "administrator bootstrap"):
                    policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")

    def test_ambiguous_status_branch_revision_and_status_tokens_fail_closed(self):
        self.write_state("Architected", "Approved", "Approved")
        index = self.repo / "features" / "INDEX.md"
        index.write_text(
            index.read_text(encoding="utf-8").replace(
                "🟣 Architected — candidate", "Architected revoked"
            ),
            encoding="utf-8",
        )
        head = self.commit_head()
        with self.assertRaisesRegex(policy.PolicyError, "ambiguous INDEX"):
            policy.validate(self.repo, self.base, head, "feat/PROJ-46-test")
        for raw in ("❌ Approved — revoked", "❌ Architected — revoked", "✅ Approved / Roadmap"):
            with self.subTest(status=raw):
                with self.assertRaisesRegex(policy.PolicyError, "status"):
                    policy.canonical_index_status(raw, "PROJ-46")
        with self.assertRaisesRegex(policy.PolicyError, "branch grammar"):
            policy.validate(self.repo, self.base, head, "totally-uncontrolled-PROJ-46")
        with self.assertRaisesRegex(policy.PolicyError, "full lowercase"):
            policy.validate(self.repo, "main", head, "feat/PROJ-46-test")
        with self.assertRaisesRegex(policy.PolicyError, "Unsupported Git"):
            policy.parse_name_status_z(b"U\0src/conflict.ts\0")
        with self.assertRaisesRegex(policy.PolicyError, "Unsupported Git"):
            policy.parse_name_status_z(b"M100\0src/file.ts\0")


if __name__ == "__main__":
    unittest.main()
