# Contract linter for .architecture/**.yaml
#
# The YAML contracts under .architecture/ are normative, but nothing verified them: every claim
# they make about this repo was checked by a person reading prose, or not at all. Three of the
# eight files did not even parse. This script checks the subset of each contract that is
# mechanically decidable, so drift is caught by `pnpm lint:contracts` instead of by a later
# session discovering the contract describes a repo that no longer exists.
#
# What it deliberately does NOT do: judge design. Whether a page leads with the right figure, or
# whether an anatomy section earns its place, is what the contract prose and a human reader are
# for. This script only checks that the contract and the tree agree about facts.
#
#   ERROR  a contract states something about the repo that is false, or is structurally malformed
#   WARN   a contract is inconsistent with its siblings, or a claim is probably stale
#   INFO   an observation worth a human glance; never fails the run
#
# Exit 1 on any ERROR. `--strict` also fails on WARN. `--quiet` prints findings only.

from __future__ import annotations

import glob
import os
import re
import sys

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.stderr.write("contract-lint needs PyYAML:  pip install pyyaml\n")
    sys.exit(2)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACT_GLOB = ".architecture/**/*.yaml"

# Contracts are one of these three tiers. The doctrine outranks the programme files, which outrank
# the page contracts -- `authority_chain` inside each file states the same thing in its own terms.
TIERS = {
    "product-ux": "doctrine",
    "payroll-programme": "programme",
    "hrm-programme": "programme",
    "page-contract": "page",
}

REQUIRED_ALL = ("schema_version", "status", "authority")
REQUIRED_PAGE = ("id", "route", "workspace", "archetype", "authority_chain", "component_ownership")

# A string is a claim about this repo if it points at one of these roots.
PATH_ROOTS = ("src", "public", "scripts", ".architecture", ".claude", ".HITL")
PATH_RE = re.compile(r"(?<![\w/.-])((?:" + "|".join(re.escape(r) for r in PATH_ROOTS) + r")/[\w\-./\[\]()*@]+)")
PATH_PREFIXES = tuple(root + "/" for root in PATH_ROOTS)

# Paths under these keys describe work not done yet, so absence is the expected state.
EXPECT_ABSENT_KEYS = {"expected_new", "expected_files", "planned"}

# Prose splits a path from its gloss with an em dash or a spaced hyphen.
GLOSS_RE = re.compile(r"\s+(?:—|--|-)\s+")

# A module reference in prose omits the extension: `src/components/shared/DataTable`.
MODULE_EXT = ("", ".ts", ".tsx", "/index.ts", "/index.tsx")

# Contract ids are two letters-and-digits: D12 doctrine, A10 programme, P04 page.
ID_RE = re.compile(r"^[A-Z]\d{2}$")

APP_PAGES = "src/app/(pages)"
SRC_EXT = (".ts", ".tsx")
COMMENT_RE = re.compile(r"^\s*(?://|/\*|\*)")
# D01 doctrine, A01 payroll programme, B01 HRM programme, P01/H01 page contracts.
CITE_RE = re.compile(r"(?<![\w#])([DABPH]\d{2})(?![\w])")


class Report:
    def __init__(self) -> None:
        self.rows: list[tuple[str, str, str]] = []

    def add(self, level: str, where: str, message: str) -> None:
        self.rows.append((level, where, message))

    def count(self, level: str) -> int:
        return sum(1 for lvl, _, _ in self.rows if lvl == level)


def rel(path: str) -> str:
    return os.path.relpath(path, ROOT).replace("\\", "/")


def exists(claim: str) -> bool:
    """Does this repo-relative path exist? A `*` makes it a glob; a trailing `/` means directory."""
    target = os.path.join(ROOT, claim.replace("/", os.sep))

    if "*" in claim:
        return bool(glob.glob(target, recursive=True))
    if claim.endswith("/"):
        return os.path.isdir(target)
    if os.path.exists(target):
        return True

    # Prose names a module, not a file. `src/components/shared/DataTable` is the same claim.
    return any(os.path.exists(target + suffix) for suffix in MODULE_EXT if suffix)


def walk(node, key_path: tuple[str, ...] = ()):
    """Yield (key_path, value) for every scalar in the document."""
    if isinstance(node, dict):
        for key, value in node.items():
            yield from walk(value, key_path + (str(key),))
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from walk(value, key_path + (f"[{index}]",))
    else:
        yield key_path, node


def line_of(source: str, needle: str) -> int:
    """Best-effort line number for a claim, so a finding is clickable."""
    index = source.find(needle)

    return source.count("\n", 0, index) + 1 if index >= 0 else 0


# ---------------------------------------------------------------------------
# CHECKS
# ---------------------------------------------------------------------------


def check_structure(report: Report, name: str, body: dict, doc_id_owner: dict) -> str | None:
    """Required fields, tier, and a unique id. Returns the contract id if it has one."""
    for field in REQUIRED_ALL:
        if field not in body:
            report.add("ERROR", name, f"missing required field `{field}`")

    authority = body.get("authority")
    tier = TIERS.get(authority)

    if authority is not None and tier is None:
        report.add("ERROR", name, f"unknown `authority` {authority!r} -- expected one of {sorted(TIERS)}")

    if body.get("status") != "normative":
        report.add("WARN", name, f"`status` is {body.get('status')!r}, not 'normative'")

    contract_id = body.get("id")

    if tier == "page":
        for field in REQUIRED_PAGE:
            if field not in body:
                report.add("ERROR", name, f"page contract missing required field `{field}`")

        prefix = os.path.basename(name).split("-")[0]

        if contract_id and contract_id != prefix:
            report.add("ERROR", name, f"`id: {contract_id}` does not match the filename prefix {prefix!r}")

    if contract_id:
        if contract_id in doc_id_owner:
            report.add("ERROR", name, f"`id: {contract_id}` is already claimed by {doc_id_owner[contract_id]}")
        else:
            doc_id_owner[contract_id] = name

    return contract_id


def check_paths(report: Report, name: str, body: dict, source: str) -> None:
    """Every repo path a contract names must exist -- that is what makes it a claim and not a note."""
    for key_path, value in walk(body):
        if not isinstance(value, str):
            continue

        expected_absent = any(key in EXPECT_ABSENT_KEYS for key in key_path)
        head = GLOSS_RE.split(value.strip(), 1)[0].strip().strip("`'\"")
        # A filename may contain spaces, which the regex cannot see. If the whole scalar resolves,
        # the claim is satisfied and its truncated prefix is not worth reporting.
        if head.startswith(PATH_PREFIXES) and "\n" not in head and exists(head):
            if expected_absent:
                report.add("INFO", name, f"`{' / '.join(key_path)}` expects {head} to be absent, but it exists now")

            continue

        for claim in (c.rstrip("),;:") for c in PATH_RE.findall(value)):
            # A whole-value path is a declaration; one buried in prose is illustrative.
            declared = claim == head
            line = line_of(source, claim)
            where = f"{name}:{line}" if line else name
            trail = " / ".join(key_path)

            if exists(claim):
                if expected_absent:
                    report.add("INFO", where, f"`{trail}` expects {claim} to be absent, but it exists now")
                continue

            if expected_absent:
                continue

            report.add(
                "ERROR" if declared else "WARN",
                where,
                f"{'declares' if declared else 'mentions'} {claim}, which does not exist (`{trail}`)",
            )


def check_route(report: Report, name: str, body: dict) -> None:
    """A page contract's route must have a page in the app router."""
    route = body.get("route")

    if not isinstance(route, str) or not route.startswith("/"):
        return

    segment = route.strip("/")
    page = f"{APP_PAGES}/{segment}/page.tsx" if segment else f"{APP_PAGES}/page.tsx"

    if not exists(page):
        report.add("ERROR", name, f"`route: {route}` has no page at {page}")

    return


def check_citations(report: Report, ids: dict, page_routes: dict) -> None:
    """IDs cited in comments must resolve, and every routed page should name its contract."""
    cited_by: dict[str, set[str]] = {}

    for path in glob.glob(os.path.join(ROOT, "src", "**", "*"), recursive=True):
        if not path.endswith(SRC_EXT) or not os.path.isfile(path):
            continue

        name = rel(path)
        text = open(path, encoding="utf-8").read()

        for number, line in enumerate(text.splitlines(), start=1):
            if not COMMENT_RE.match(line):
                continue

            for cite in CITE_RE.findall(line):
                cited_by.setdefault(cite, set()).add(name)

                if cite not in ids:
                    report.add("ERROR", f"{name}:{number}", f"cites `{cite}`, which is not an id in any contract")

    # A named section must agree with the id beside it: `floating_query` (D12).
    named = re.compile(r"`(\w+)`\s*\((" + "|".join(sorted(ids)) + r")\)")

    for path in glob.glob(os.path.join(ROOT, "src", "**", "*"), recursive=True):
        if not path.endswith(SRC_EXT) or not os.path.isfile(path):
            continue

        name = rel(path)
        text = open(path, encoding="utf-8").read()

        for number, line in enumerate(text.splitlines(), start=1):
            for section, cite in named.findall(line):
                actual = ids[cite]["section"]

                if actual and section != actual:
                    report.add(
                        "ERROR",
                        f"{name}:{number}",
                        f"cites `{section}` ({cite}) but {cite} is `{actual}` in {ids[cite]['file']}",
                    )

    # Citation as an obligation, not a habit: a routed page should name the contract that governs it.
    for contract_id, (contract, route) in sorted(page_routes.items()):
        segment = route.strip("/")
        page = f"{APP_PAGES}/{segment}/page.tsx"
        target = os.path.join(ROOT, page.replace("/", os.sep))

        if not os.path.exists(target):
            continue

        if contract_id not in open(target, encoding="utf-8").read():
            report.add("WARN", page, f"does not name its contract {contract_id} ({rel(contract)})")

    for contract_id in sorted(page_routes):
        if contract_id not in cited_by:
            report.add("INFO", page_routes[contract_id][0], f"{contract_id} is cited nowhere in src")


def check_consumer_records(report: Report, name: str, body: dict) -> None:
    """P02 records a consumer check and says never to trust the record. So re-run it."""
    ownership = body.get("component_ownership")

    if not isinstance(ownership, dict):
        return

    legacy = ownership.get("legacy_directory")

    if not isinstance(legacy, dict):
        return

    check = legacy.get("consumer_check")
    directory = legacy.get("path")

    if not isinstance(check, dict) or not isinstance(directory, str):
        return

    for record in check.get("results") or []:
        if not isinstance(record, dict):
            continue

        module = record.get("file")

        if not isinstance(module, str):
            continue

        stem = module.rsplit(".", 1)[0]
        module_path = f"{directory.rstrip('/')}/{module}"
        recorded = len(record.get("consumers") or [])

        if not exists(module_path):
            report.add(
                "WARN",
                f"{name} :: {module}",
                f"consumer_check records {recorded} consumer(s), but the module is gone from {module_path}",
            )
            continue

        found = set()

        for path in glob.glob(os.path.join(ROOT, "src", "**", "*"), recursive=True):
            if not path.endswith(SRC_EXT) or not os.path.isfile(path):
                continue

            consumer = rel(path)

            if consumer == module_path:
                continue

            if re.search(rf"[/'\"]{re.escape(stem)}['\"]", open(path, encoding="utf-8").read()):
                found.add(consumer)

        if len(found) != recorded:
            report.add(
                "WARN",
                f"{name} :: {module}",
                f"consumer_check recorded {recorded} consumer(s) on {check.get('performed_on')}; "
                f"{len(found)} found now" + (f" ({', '.join(sorted(found))})" if found else ""),
            )


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------


def main() -> int:
    strict = "--strict" in sys.argv
    quiet = "--quiet" in sys.argv
    report = Report()

    files = sorted(rel(p) for p in glob.glob(os.path.join(ROOT, CONTRACT_GLOB), recursive=True))

    if not files:
        sys.stderr.write("contract-lint found no contracts under .architecture/\n")

        return 2

    bodies: dict[str, dict] = {}
    sources: dict[str, str] = {}

    for name in files:
        source = open(os.path.join(ROOT, name.replace("/", os.sep)), encoding="utf-8").read()
        sources[name] = source

        try:
            document = yaml.safe_load(source)
        except yaml.YAMLError as error:
            mark = getattr(error, "problem_mark", None)
            where = f"{name}:{mark.line + 1}" if mark else name
            report.add("ERROR", where, f"does not parse as YAML -- {getattr(error, 'problem', error)}")
            continue

        if not isinstance(document, dict) or len(document) != 1:
            report.add("ERROR", name, "must have exactly one top-level key naming the contract")
            continue

        body = next(iter(document.values()))

        if not isinstance(body, dict):
            report.add("ERROR", name, "top-level key must hold a mapping")
            continue

        bodies[name] = body

    # Collect every id the contracts define, so citations in src can be resolved against them.
    ids: dict[str, dict] = {}
    page_routes: dict[str, tuple[str, str]] = {}
    doc_id_owner: dict[str, str] = {}

    for name, body in bodies.items():
        contract_id = check_structure(report, name, body, doc_id_owner)

        if contract_id:
            ids[contract_id] = {"file": name, "section": None}

            if body.get("authority") == "page-contract" and isinstance(body.get("route"), str):
                page_routes[contract_id] = (name, body["route"])

        # A top-level section declares an id. Anywhere deeper -- a route table, a defect record --
        # only references one, so it makes the id resolvable without competing to own it.
        for section, value in body.items():
            if isinstance(value, dict) and ID_RE.match(str(value.get("id"))):
                section_id = value["id"]

                if section_id in ids:
                    report.add("ERROR", name, f"section id {section_id} is already claimed by {ids[section_id]['file']}")
                else:
                    ids[section_id] = {"file": name, "section": section}

        for key_path, value in walk(body):
            if key_path and key_path[-1] == "id" and ID_RE.match(str(value)) and value not in ids:
                ids[value] = {"file": name, "section": None}

    for name, body in bodies.items():
        check_paths(report, name, body, sources[name])
        check_route(report, name, body)
        check_consumer_records(report, name, body)

    if ids:
        check_citations(report, ids, page_routes)

    order = {"ERROR": 0, "WARN": 1, "INFO": 2}

    for level in ("ERROR", "WARN", "INFO"):
        rows = [row for row in report.rows if row[0] == level]

        if not rows:
            continue

        print(f"\n{level} ({len(rows)})")

        for _, where, message in sorted(rows, key=lambda row: (order[row[0]], row[1])):
            print(f"  {where}\n      {message}")

    errors = report.count("ERROR")
    warnings = report.count("WARN")

    if not quiet or errors or warnings:
        print(
            f"\n{len(files)} contracts, {len(ids)} ids, "
            f"{errors} error(s), {warnings} warning(s), {report.count('INFO')} note(s)"
        )

    return 1 if errors or (strict and warnings) else 0


if __name__ == "__main__":
    sys.exit(main())
