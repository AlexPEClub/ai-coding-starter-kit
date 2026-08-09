#!/usr/bin/env python3
"""Trusted base-branch pull-request policy.

The pull_request_target workflow executes this file from the default-branch
checkout. Candidate files and Git objects are inspected strictly as data; no
candidate code, test, hook, package script, or dependency is executed.
"""
from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

SHA_RE = re.compile(r"[0-9a-f]{40}")
BRANCH_RE = re.compile(
    r"(?:feat|fix|chore|refactor|test|docs|hotfix)/(PROJ-\d+)(?:-[a-z0-9][a-z0-9-]*)?"
)
COMMIT_RE = re.compile(
    r"^(feat|fix|refactor|test|docs|deploy|chore)\((PROJ-\d+)\): "
    r"[^\s\x00-\x1f\x7f](?:[^\x00-\x1f\x7f]*[^\s\x00-\x1f\x7f])?$"
)
SPEC_HEADER_RE_TEMPLATE = r"^#\s+{feature}\s*:"
CANONICAL_STATUSES = (
    "Roadmap",
    "Planned",
    "Architected",
    "In Progress",
    "In Review",
    "Approved",
    "Deployed",
)
STATUS_MARKERS = {
    "Roadmap": {"🔵"},
    "Planned": {"🔵"},
    "Architected": {"🟣"},
    "In Progress": {"🟡"},
    "In Review": {"🟠"},
    "Approved": {"🟢", "✅"},
    "Deployed": {"✅"},
}
CODE_ROOTS = (
    "src/",
    "supabase/",
    "scripts/",
    ".hermes/hooks/",
    ".hermes/skills/",
    ".hermes/roles/",
    ".githooks/",
)
PROTECTED_FILES = {
    ".hermes.md",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "eslint.config.js",
    "eslint.config.mjs",
    "eslint.config.ts",
    "vitest.config.js",
    "vitest.config.mjs",
    "vitest.config.ts",
    "playwright.config.js",
    "playwright.config.mjs",
    "playwright.config.ts",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
}
TRUSTED_SCRIPT_PREFIX = ".github/scripts/"
WORKFLOW_PREFIX = ".github/workflows/"


class PolicyError(RuntimeError):
    pass


def git(repo: Path, *args: str, text: bool = True) -> str | bytes:
    try:
        result = subprocess.run(
            ["git", *args], cwd=repo, check=True, capture_output=True, text=text
        )
    except (OSError, subprocess.CalledProcessError) as exc:
        raise PolicyError(f"Git state could not be read: {exc}") from exc
    return result.stdout


def require_commit(repo: Path, revision: str, label: str) -> None:
    if not SHA_RE.fullmatch(revision):
        raise PolicyError(f"{label} must be a full lowercase commit SHA.")
    try:
        git(repo, "cat-file", "-e", f"{revision}^{{commit}}")
    except PolicyError as exc:
        raise PolicyError(f"{label} is not an available commit object.") from exc


def parse_name_status_z(raw: bytes) -> set[str]:
    fields = raw.split(b"\0")
    if fields and fields[-1] == b"":
        fields.pop()
    paths: set[str] = set()
    index = 0
    while index < len(fields):
        try:
            status = fields[index].decode("ascii", errors="strict")
        except UnicodeDecodeError as exc:
            raise PolicyError("Git status is not ASCII.") from exc
        index += 1
        if re.fullmatch(r"[ADMT]", status):
            count = 1
        elif re.fullmatch(r"[RC](?:100|[0-9]{1,2})", status):
            count = 2
        else:
            raise PolicyError(f"Unsupported Git change status: {status!r}")
        if index + count > len(fields):
            raise PolicyError("Malformed NUL-delimited Git change output.")
        for value in fields[index : index + count]:
            try:
                path = value.decode("utf-8", errors="strict")
            except UnicodeDecodeError as exc:
                raise PolicyError("Git path is not valid UTF-8.") from exc
            if not path or path.startswith("/") or "\0" in path:
                raise PolicyError(f"Invalid Git path: {path!r}")
            paths.add(path)
        index += count
    return paths


def changed_paths(repo: Path, base: str, head: str) -> set[str]:
    raw = git(
        repo,
        "-c",
        "core.quotepath=false",
        "diff",
        "--name-status",
        "-z",
        "-M",
        "-C",
        f"{base}...{head}",
        text=False,
    )
    assert isinstance(raw, bytes)
    return parse_name_status_z(raw)


def tree_entries(
    repo: Path, revision: str, prefix: str
) -> dict[str, tuple[str, str, str]]:
    raw = git(
        repo,
        "-c",
        "core.quotepath=false",
        "ls-tree",
        "-rz",
        "--full-tree",
        revision,
        "--",
        prefix,
        text=False,
    )
    assert isinstance(raw, bytes)
    records = raw.split(b"\0")
    if records and records[-1] == b"":
        records.pop()
    result: dict[str, tuple[str, str, str]] = {}
    for record in records:
        try:
            header, raw_path = record.split(b"\t", 1)
            mode, object_type, object_id = header.decode("ascii").split(" ")
            path = raw_path.decode("utf-8", errors="strict")
        except (ValueError, UnicodeDecodeError) as exc:
            raise PolicyError("Malformed or non-UTF-8 ls-tree output.") from exc
        if not re.fullmatch(r"[0-7]{6}", mode):
            raise PolicyError(f"Invalid Git object mode for {path!r}.")
        if object_type not in {"blob", "commit"} or not SHA_RE.fullmatch(object_id):
            raise PolicyError(f"Invalid Git tree object for {path!r}.")
        if path in result:
            raise PolicyError(f"Duplicate Git tree path: {path!r}")
        result[path] = (mode, object_type, object_id)
    return result


def is_protected(path: str) -> bool:
    return path in PROTECTED_FILES or path.startswith(CODE_ROOTS)


def authoritative_fields(text: str, feature: str) -> dict[str, str]:
    forbidden_separators = {"\r", "\x0b", "\x0c", "\x1c", "\x1d", "\x1e", "\x85", "\u2028", "\u2029"}
    if any(character in text for character in forbidden_separators):
        raise PolicyError(f"{feature} contains a non-canonical line separator.")
    lines = text.split("\n")
    if len(lines) < 6 or not re.fullmatch(
        rf"# {re.escape(feature)}: \S.*", lines[0]
    ):
        raise PolicyError(f"{feature} canonical visible H1 is missing.")
    if lines[1] != "":
        raise PolicyError(f"{feature} metadata must start after one blank line.")
    status_match = re.fullmatch(r"## Status: (\S(?:.*\S)?)", lines[2])
    if not status_match:
        raise PolicyError(f"{feature} visible Status metadata is missing.")
    fields: dict[str, str] = {"Status": status_match.group(1)}
    index = 3
    while index < len(lines) and lines[index] != "":
        match = re.fullmatch(r"\*\*([^*:]+):\*\* (\S(?:.*\S)?)", lines[index])
        if not match:
            raise PolicyError(
                f"{feature} metadata block contains hidden or non-canonical markup."
            )
        name, value = match.groups()
        if name in fields:
            raise PolicyError(f"{feature} metadata field {name!r} is duplicated.")
        fields[name] = value
        index += 1
    if index >= len(lines):
        raise PolicyError(f"{feature} metadata block is not terminated.")
    while index < len(lines) and lines[index] == "":
        index += 1
    if index >= len(lines) or not re.fullmatch(r"## (?!Status:)\S.*", lines[index]):
        raise PolicyError(f"{feature} first content section is missing.")
    decisive = {
        "Status": re.compile(r"^## Status: "),
        "Spec Approval": re.compile(r"^\*\*Spec Approval:\*\* "),
        "Architecture Approval": re.compile(r"^\*\*Architecture Approval:\*\* "),
    }
    for name, pattern in decisive.items():
        if sum(bool(pattern.match(line)) for line in lines) != 1 or name not in fields:
            raise PolicyError(
                f"{feature} authoritative field {name!r} is missing, misplaced, or ambiguous."
            )
    return fields


def read_single_field(text: str, name: str, feature: str) -> str:
    fields = authoritative_fields(text, feature)
    if name not in fields:
        raise PolicyError(f"{feature} authoritative field {name!r} is missing.")
    return fields[name]


def canonical_index_status(raw_status: str, feature: str) -> str:
    choices = "|".join(re.escape(value) for value in CANONICAL_STATUSES)
    match = re.fullmatch(
        rf"(?P<marker>🔵|🟣|🟡|🟠|🟢|✅)\s+"
        rf"(?P<status>{choices})(?:\s+—\s+[^|\r\n]+)?",
        raw_status.strip(),
    )
    if not match:
        raise PolicyError(f"Non-canonical or ambiguous INDEX status for {feature}.")
    status = match.group("status")
    if match.group("marker") not in STATUS_MARKERS[status]:
        raise PolicyError(f"Incorrect INDEX status marker for {feature}.")
    return status


def index_rows(text: str) -> dict[str, tuple[str, str]]:
    sections = re.findall(
        r"(?ms)^## Features\s*$\n(.*?)(?=^##\s|\Z)", text
    )
    if len(sections) != 1:
        raise PolicyError("INDEX Features section is missing or ambiguous.")
    rows: dict[str, tuple[str, str]] = {}
    for line in sections[0].splitlines():
        match = re.match(r"^\|\s*(PROJ-\d+)\s*\|", line)
        if not match:
            continue
        feature = match.group(1)
        cells = line.split("|")
        if len(cells) < 6:
            raise PolicyError(f"Malformed INDEX row for {feature}.")
        if feature in rows:
            raise PolicyError(f"Duplicate INDEX row for {feature}.")
        rows[feature] = (canonical_index_status(cells[3], feature), line)
    return rows


def next_available_id(text: str) -> str:
    matches = re.findall(r"(?m)^## Next Available ID: (PROJ-\d+)$", text)
    if len(matches) != 1:
        raise PolicyError("Next Available ID is missing or ambiguous.")
    return matches[0]


def mask_index_bytes(raw: bytes, feature: str) -> bytes:
    feature_bytes = re.escape(feature.encode("ascii"))
    target_pattern = re.compile(
        rb"(?m)^\|[ \t]*" + feature_bytes + rb"[ \t]*\|[^\r\n]*(?:\r?\n|$)"
    )
    next_pattern = re.compile(
        rb"(?m)^(?P<prefix>## Next Available ID: )PROJ-[0-9]+(?P<eol>\n|$)"
    )
    target_count = len(target_pattern.findall(raw))
    if target_count > 1:
        raise PolicyError(f"Duplicate byte-level INDEX row for {feature}.")
    if len(next_pattern.findall(raw)) != 1:
        raise PolicyError("Next Available ID is missing or ambiguous at byte level.")
    without_target = target_pattern.sub(b"", raw)
    return next_pattern.sub(
        lambda match: match.group("prefix") + b"<MASKED>" + match.group("eol"),
        without_target,
    )


def show_optional_bytes(repo: Path, ref: str, path: str) -> bytes:
    result = subprocess.run(
        ["git", "show", f"{ref}:{path}"], cwd=repo, capture_output=True
    )
    return result.stdout if result.returncode == 0 else b""


def show_optional(repo: Path, ref: str, path: str) -> str:
    raw = show_optional_bytes(repo, ref, path)
    try:
        return raw.decode("utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        raise PolicyError(f"Candidate file is not valid UTF-8: {path!r}") from exc


def validate_feature_state(repo: Path, feature: str, head: str) -> None:
    headed: list[tuple[str, str]] = []
    spec_candidates: list[str] = []
    boundary = re.compile(rf"^features/{re.escape(feature)}(?!\d)")
    canonical_spec = re.compile(
        rf"features/{re.escape(feature)}-[a-z0-9][a-z0-9-]*\.md"
    )
    canonical_architecture = f"features/{feature}-architektur.md"
    entries = tree_entries(repo, head, "features")
    for path, (mode, object_type, _object_id) in entries.items():
        if mode != "100644" or object_type != "blob":
            raise PolicyError(f"Feature path is not an ordinary 100644 blob: {path!r}")
        if boundary.match(path) and not (
            canonical_spec.fullmatch(path) or path == canonical_architecture
        ):
            raise PolicyError(f"Non-canonical feature path: {path!r}")
        if canonical_spec.fullmatch(path) and path != canonical_architecture:
            spec_candidates.append(path)
        text = show_optional(repo, head, path)
        html_feature_headings = re.findall(
            r"(?is)<h[1-6](?:\s[^>]*)?>\s*(PROJ-\d+)\b", text
        )
        if html_feature_headings:
            raise PolicyError(f"Raw HTML feature heading is not allowed in {path!r}.")
        heading_ids = re.findall(
            r"(?m)^[ \t]*#[ \t]+(PROJ-\d+)(?=[ \t]*(?::|[-–—]|$))",
            text,
        )
        unrelated_headings = set(heading_ids) - {feature}
        if unrelated_headings:
            raise PolicyError(
                f"Unrelated feature heading in {path!r}: "
                + ", ".join(sorted(unrelated_headings))
            )
        headed.extend((path, text) for heading_id in heading_ids if heading_id == feature)
    if len(spec_candidates) != 1:
        raise PolicyError(
            f"Expected exactly one canonical spec path for {feature}; found {len(spec_candidates)}."
        )
    if len(headed) != 1:
        raise PolicyError(
            f"Expected exactly one headed spec for {feature}; found {len(headed)}."
        )
    path, spec = headed[0]
    if not canonical_spec.fullmatch(path):
        raise PolicyError(f"Non-canonical feature spec path: {path!r}")
    if not re.search(
        SPEC_HEADER_RE_TEMPLATE.format(feature=re.escape(feature)), spec, re.MULTILINE
    ):
        raise PolicyError(f"Canonical spec header is missing for {feature}.")
    index = show_optional(repo, head, "features/INDEX.md")
    rows = index_rows(index)
    if feature not in rows:
        raise PolicyError(f"{feature} is missing from features/INDEX.md.")
    spec_status = read_single_field(spec, "Status", feature)
    if spec_status not in CANONICAL_STATUSES:
        raise PolicyError(f"Non-canonical spec status for {feature}.")
    if spec_status != rows[feature][0]:
        raise PolicyError(f"Spec and INDEX status disagree for {feature}.")
    for name in ("Spec Approval", "Architecture Approval"):
        if read_single_field(spec, name, feature) != "Approved":
            raise PolicyError(f"{name} for {feature} is not Approved.")
    if rows[feature][0] not in {
        "Architected",
        "In Progress",
        "In Review",
        "Approved",
        "Deployed",
    }:
        raise PolicyError(f"State {rows[feature][0]!r} does not permit protected changes.")


def validate_index_isolation(
    repo: Path, base: str, head: str, feature: str, paths: set[str]
) -> bool:
    if "features/INDEX.md" not in paths:
        return False
    base_text = show_optional(repo, base, "features/INDEX.md")
    head_text = show_optional(repo, head, "features/INDEX.md")
    base_rows = index_rows(base_text)
    head_rows = index_rows(head_text)
    unrelated = {
        feature_id
        for feature_id in set(base_rows) | set(head_rows)
        if feature_id != feature and base_rows.get(feature_id) != head_rows.get(feature_id)
    }
    if unrelated:
        raise PolicyError(
            "PR changes unrelated INDEX rows: " + ", ".join(sorted(unrelated))
        )
    base_raw = show_optional_bytes(repo, base, "features/INDEX.md")
    head_raw = show_optional_bytes(repo, head, "features/INDEX.md")
    if mask_index_bytes(base_raw, feature) != mask_index_bytes(head_raw, feature):
        raise PolicyError("PR changes unrelated INDEX bytes or workflow metadata.")
    base_next = next_available_id(base_text)
    head_next = next_available_id(head_text)
    if base_next != head_next:
        number = int(feature.split("-", 1)[1])
        expected_next = f"PROJ-{number + 1}"
        if feature in base_rows or base_next != feature or head_next != expected_next:
            raise PolicyError("Invalid Next Available ID transition.")
    return True


def changed_feature_heading_ids(
    repo: Path, revision: str, paths: set[str]
) -> set[str]:
    result: set[str] = set()
    for path in paths:
        if not path.startswith("features/") or path == "features/INDEX.md":
            continue
        text = show_optional(repo, revision, path)
        result.update(
            re.findall(r"(?m)^[ \t]*#+[ \t]+(PROJ-\d+)[ \t]*:", text)
        )
    return result


def validate(repo: Path, base: str, head: str, source_branch: str) -> None:
    repo = repo.resolve(strict=True)
    require_commit(repo, base, "BASE_SHA")
    require_commit(repo, head, "HEAD_SHA")
    actual_head = str(git(repo, "rev-parse", "HEAD")).strip()
    if actual_head != head:
        raise PolicyError("Candidate checkout does not match HEAD_SHA.")
    branch_match = BRANCH_RE.fullmatch(source_branch)
    if not branch_match:
        raise PolicyError("Source branch does not match the approved branch grammar.")
    feature = branch_match.group(1)
    commit_ids_raw = git(repo, "rev-list", "--reverse", f"{base}..{head}", text=False)
    assert isinstance(commit_ids_raw, bytes)
    commit_ids = [value for value in commit_ids_raw.split(b"\n") if value]
    if not commit_ids:
        raise PolicyError("Pull request contains no commits.")
    subjects: list[str] = []
    for raw_commit_id in commit_ids:
        try:
            commit_id = raw_commit_id.decode("ascii")
        except UnicodeDecodeError as exc:
            raise PolicyError("Commit ID is not ASCII.") from exc
        if not SHA_RE.fullmatch(commit_id):
            raise PolicyError("Malformed commit ID from revision walk.")
        raw_commit = git(repo, "cat-file", "commit", commit_id, text=False)
        assert isinstance(raw_commit, bytes)
        if b"\n\n" not in raw_commit:
            raise PolicyError(f"Commit {commit_id} has no message separator.")
        message = raw_commit.split(b"\n\n", 1)[1]
        raw_subject = message.split(b"\n", 1)[0]
        try:
            subjects.append(raw_subject.decode("utf-8", errors="strict"))
        except UnicodeDecodeError as exc:
            raise PolicyError("Commit subject is not valid UTF-8.") from exc
    for subject in subjects:
        if any(character.isspace() and character != " " for character in subject):
            raise PolicyError(f"Invalid commit subject whitespace: {subject!r}")
        match = COMMIT_RE.fullmatch(subject)
        if not match:
            raise PolicyError(f"Invalid commit subject: {subject!r}")
        if match.group(2) != feature:
            raise PolicyError(
                f"Commit feature {match.group(2)} does not match branch {feature}."
            )
    paths = changed_paths(repo, base, head)
    if any(path.startswith(WORKFLOW_PREFIX) for path in paths):
        raise PolicyError("Workflow files require the administrator bootstrap process.")
    if any(path.startswith(TRUSTED_SCRIPT_PREFIX) for path in paths):
        raise PolicyError("Trusted policy scripts require the administrator bootstrap process.")
    allowed_spec = re.compile(
        rf"features/{re.escape(feature)}-[a-z0-9][a-z0-9-]*\.md"
    )
    allowed_architecture = f"features/{feature}-architektur.md"
    invalid_feature_paths = {
        path
        for path in paths
        if path.startswith("features/")
        and path != "features/INDEX.md"
        and not (allowed_spec.fullmatch(path) or path == allowed_architecture)
    }
    if invalid_feature_paths:
        raise PolicyError(
            "PR changes feature paths outside the active feature: "
            + ", ".join(sorted(repr(path) for path in invalid_feature_paths))
        )
    changed_feature_ids: set[str] = set()
    for path in paths:
        match = re.match(r"^features/(PROJ-\d+)(?!\d)", path)
        if match:
            changed_feature_ids.add(match.group(1))
    changed_feature_ids.update(changed_feature_heading_ids(repo, base, paths))
    changed_feature_ids.update(changed_feature_heading_ids(repo, head, paths))
    unrelated_specs = changed_feature_ids - {feature}
    if unrelated_specs:
        raise PolicyError(
            "PR changes unrelated feature specs: "
            + ", ".join(sorted(unrelated_specs))
        )
    index_changed = validate_index_isolation(repo, base, head, feature, paths)
    state_changed = any(path.startswith("features/") for path in paths)
    protected_changed = any(is_protected(path) for path in paths)
    if state_changed or protected_changed:
        validate_feature_state(repo, feature, head)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, type=Path)
    parser.add_argument("--base", required=True)
    parser.add_argument("--head", required=True)
    parser.add_argument("--branch", required=True)
    args = parser.parse_args()
    try:
        validate(args.repo, args.base, args.head, args.branch)
    except Exception as exc:
        print(f"Trusted Workflow Gate: {exc}")
        return 1
    print(f"Trusted Workflow Gate: approved {args.branch} at {args.head}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
