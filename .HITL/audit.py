"""Design-system audit for xForge. Run from the repo root:
    python .claude/skills/xforge-design-system/scripts/audit.py        # -v lists every hit
                                                                      # --strict also fails on DOWN

There is no test framework in this repo, so these checks are the de facto suite. The script exits
non-zero when any count is above its budget, which makes it a gate rather than a ritual.

Budgets are a ratchet, not a target. Where the number is already zero it must stay zero; where the
repo carries inherited debt the budget is today's count, so the number can only go down. Lower a
budget when you clear something -- that is the whole mechanism. `--strict` fails the run when a
count has improved and the budget is stale, so CI forces the update instead of trusting a habit.

Checks with budget None are unmeasured. Run once, read the count, and write it in. They report but
never fail until you do.

Scope: `src/views`, `src/app`, `src/components/shared`. `src/components/ui` is deliberately out of
scope for every check because it tracks upstream shadcn; a palette colour or a raw <button> there is
upstream's decision, and rewriting it is the "edit, do not redraw" failure the skill warns about.
Every code count in SKILL.md is measured over exactly this tree, so the numbers are comparable.
Counts stated over all of `src` (useEffect, sr-only) are NOT from this script and say so there.

A check that has never gone red is decoration. Before adding one, point it at code that should fail
and watch it fail. Everything below has been run against a fixture that should trip it.

Fixed 2026-09-06 after the previous version was tested rather than read:
  - no scope guard: run from the wrong cwd it reported a clean tree and exited 0, and invited you
    to ratchet every budget to zero
  - the 400-char exclusion window swallowed the NEXT element's `type='file'`, so any raw <button>
    within 400 chars of a legitimate hidden file input was suppressed. Tag-bounded now.
  - single-quote-only regexes: a double-quoted faked CardTitle scored 0, a double-quoted hidden
    file input scored as a false positive
  - `<input/>` (self-closing, no space) was not matched at all
  - `border-t-red-500`, `bg-white`, `text-black` all passed the palette check
  - `#fff` and `#FFAA0080` both passed the hex check
"""

import os
import re
import sys
from datetime import date

SCOPE = ("src/views", "src/app", "src/components/shared")

Q = r"['\"]"  # JSX quote style is not pinned in this repo; never hardcode one.

# Every Tailwind colour-utility prefix, including directional and side variants. A narrower version
# read clean while ring-sky-600/20 and fill-sky-500 sat in the tree; a later one missed
# border-t-red-500 for the same reason one level down.
PALETTE = re.compile(
    r"\b(bg|text|border|ring|fill|stroke|from|via|to|divide|outline|shadow|accent|caret"
    r"|decoration|placeholder)(-(t|r|b|l|x|y|s|e|tl|tr|bl|br))?-"
    r"((red|green|blue|yellow|orange|purple|pink|gray|slate|zinc|sky|emerald|amber|teal|indigo"
    r"|violet|rose|lime|cyan|fuchsia|stone|neutral)-[0-9]{2,3}|white|black)\b"
)
COMMENT_LINE = re.compile(r"^\s*(\*|//)")
# 3, 4, 6 and 8 digit hex. The old {6} missed #fff and #FFAA0080.
HEX = re.compile(r"#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")
CARD_HEADER = re.compile(r"<CardHeader\b[^>]*>(.*?)</CardHeader>", re.S)
CARD_ACTION = re.compile(r"<CardAction\b[^>]*>.*?</CardAction>", re.S)
FAKE_TITLE = re.compile(rf"<span\s+className={Q}[^'\"]*\bfont-semibold\b[^'\"]*{Q}")
RAW_ELEMENT = re.compile(r"<(button|input)[\s/>]")
RAW_ALLOWED = re.compile(rf"type={Q}file{Q}|getInputProps")
NESTED_LINK = re.compile(r"<Link[^>]*>\s*<Button", re.S)
# Counts the compliant wrapper too, so adopting SectionCardTitle cannot silently zero the count.
CARD_TITLE = re.compile(r"<(CardTitle|SectionCardTitle)(\s[^>]*)?>", re.S)
# Re-declaring what the primitive already sets. It looks harmless and it is exactly the coupling
# the "cards move, fakes do not" argument exists to prevent.
TITLE_RESTYLED = re.compile(rf"<CardTitle[^>]*className={Q}[^'\"]*\b(text-\w+|font-semibold)\b")
INTL_FORMAT = re.compile(
    r"\bIntl\.(DateTimeFormat|NumberFormat)\b|\btoLocale(Date|Time)?String\b"
)
CLOCK = re.compile(r"\bnew Date\(\s*\)|\bDate\.now\(\)")
# A hand-rolled aria-sort is the failure the shared helper exists to prevent, and counting files
# that USE the helper cannot see it.
ARIA_SORT_INLINE = re.compile(r"aria-sort=(?!\{ariaSortFor)")

_CACHE = None


def sources():
    """Walk the scope once and cache. Six checks previously meant six full passes."""
    global _CACHE
    if _CACHE is None:
        found = []
        for root in SCOPE:
            for folder, _, files in os.walk(root):
                for name in files:
                    if name.endswith(".tsx"):
                        path = os.path.join(folder, name).replace(os.sep, "/")
                        with open(path, encoding="utf-8") as fh:
                            found.append((path, fh.read()))
        _CACHE = found
    return _CACHE


def check_scope():
    """Refuse to report on a tree that is not there.

    Without this, running from the wrong directory printed a perfect green board, exited 0, and
    told you to lower every budget -- which would have destroyed the ratchet permanently.
    """
    missing = [d for d in SCOPE if not os.path.isdir(d)]
    if missing:
        sys.stderr.write(
            f"error: not in the repo root -- missing {', '.join(missing)}\n"
            f"       cwd is {os.getcwd()}\n"
        )
        return False
    if not sources():
        sys.stderr.write(f"error: no .tsx files under {', '.join(SCOPE)}\n")
        return False
    return True


def tag_text(text, start):
    """The source of one JSX opening tag, quote- and brace-aware.

    A fixed-width window is wrong in both directions: it truncates a long tag, and it reads into
    the NEXT element. The second cost a real violation -- a raw <button> followed by a legitimate
    hidden file input scored 0 because the window reached the input's type='file'.
    """
    depth = 0
    quote = None
    i = start
    while i < len(text):
        c = text[i]
        if quote:
            if c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        elif c == ">" and depth == 0:
            return text[start : i + 1]
        i += 1
    return text[start:]


def line_of(text, index):
    return text.count("\n", 0, index) + 1


def _by_line(hits, pattern, skip_comments=False):
    for path, text in sources():
        for n, line in enumerate(text.splitlines(), 1):
            if skip_comments and COMMENT_LINE.match(line):
                continue
            if pattern.search(line):
                hits.append(f"{path}:{n}")


def _by_match(hits, pattern, keep=None):
    for path, text in sources():
        for m in pattern.finditer(text):
            if keep is None or keep(text, m):
                hits.append(f"{path}:{line_of(text, m.start())}")


def palette_colours(hits):
    """Tailwind palette colours that should be semantic tokens.

    Only full-line comments are skipped, so a file documenting why it avoided a palette colour is
    not reported for naming one. A class inside a block comment starting mid-line still matches --
    this is deliberately not a parser.
    """
    _by_line(hits, PALETTE, skip_comments=True)


def hardcoded_hex(hits):
    _by_line(hits, HEX)


def faked_card_titles(hits):
    """Card headers faking a title instead of using CardTitle.

    Must look INSIDE the header: a file-level search counts a metric value in CardContent as a
    title, which is how this once reported 29 files when 17 were affected.
    """
    for path, text in sources():
        for m in CARD_HEADER.finditer(text):
            if FAKE_TITLE.search(CARD_ACTION.sub("", m.group(1))):
                hits.append(f"{path}:{line_of(text, m.start())}")


def raw_elements(hits):
    """Raw <button>/<input> where a primitive exists, excluding hidden and library-owned inputs."""
    _by_match(hits, RAW_ELEMENT, lambda t, m: not RAW_ALLOWED.search(tag_text(t, m.start())))


def nested_link_button(hits):
    """A Link wrapping a Button -- an anchor inside a button. Use render + nativeButton={false}."""
    _by_match(hits, NESTED_LINK)


def card_titles_not_headings(hits):
    """Card section titles outside the document outline. See "A card title is not a heading"."""
    _by_match(hits, CARD_TITLE, lambda t, m: "role=" not in (m.group(2) or ""))


def card_titles_restyled(hits):
    """CardTitle re-declaring type it already carries. Pins the call site against the primitive."""
    _by_match(hits, TITLE_RESTYLED)


def intl_formatting(hits):
    """Intl / toLocaleString in a component. Node and browser ICU disagree -- hydration mismatch.

    Use money.ts and the payroll date helpers. Budget is today's count, not zero, until each
    surviving call site is confirmed client-only.
    """
    _by_line(hits, INTL_FORMAT, skip_comments=True)


def clock_in_component(hits):
    """new Date() / Date.now() inside a component. Read the clock once in the page, pass it down."""
    _by_line(hits, CLOCK, skip_comments=True)


def inline_aria_sort(hits):
    """aria-sort not coming from the shared helper -- the copy the helper exists to prevent."""
    _by_line(hits, ARIA_SORT_INLINE)


CHECKS = (
    # (name, function, budget) -- budget is a ratchet; None means unmeasured, report only.
    ("palette colours instead of semantic tokens", palette_colours, 0),
    ("hardcoded hex", hardcoded_hex, 0),
    ("card headers faking a title", faked_card_titles, 0),
    ("Link wrapping a Button", nested_link_button, 0),
    ("CardTitle re-declaring its own type", card_titles_restyled, None),
    ("Intl / toLocaleString in a component", intl_formatting, None),
    ("clock read inside a component", clock_in_component, None),
    ("aria-sort not from the shared helper", inline_aria_sort, 0),
    ("raw <button>/<input> (inherited, AdminCN template views)", raw_elements, 25),
    ("card titles not in the document outline (inherited)", card_titles_not_headings, 83),
)


def main():
    argv = sys.argv[1:]
    verbose = "-v" in argv or "--verbose" in argv
    strict = "--strict" in argv

    if not check_scope():
        return 2

    print(f"xForge design-system audit, {date.today().isoformat()}")
    print(f"scope: {', '.join(SCOPE)}  ({len(sources())} tsx files)\n")

    failed = stale = unmeasured = 0

    for name, fn, budget in CHECKS:
        hits = []
        fn(hits)
        count = len(hits)

        if budget is None:
            mark, unmeasured = "??  ", unmeasured + 1
            shown = "  -"
        else:
            shown = f"{budget:<3}"
            if count > budget:
                mark, failed = "FAIL", failed + 1
            elif count == budget:
                mark = "ok  "
            else:
                mark, stale = "DOWN", stale + 1

        print(f"  [{mark}] {count:>3} / {shown}  {name}")

        if hits and (verbose or mark in ("FAIL", "??  ")):
            for hit in hits[:20]:
                print(f"          {hit}")
            if count > 20:
                print(f"          ... and {count - 20} more")

    print()
    if failed:
        print(f"{failed} check(s) above budget. Fix, or justify and raise the budget deliberately.")
    if stale:
        word = "fails" if strict else "does not fail"
        print(f"{stale} count(s) came DOWN -- lower the budget in this file. --strict {word} on this.")
    if unmeasured:
        print(f"{unmeasured} check(s) unmeasured. Read the count above and write it into CHECKS.")
    if not (failed or stale or unmeasured):
        print("All checks at budget.")
    print("\nThen the real gates:  pnpm check-types && pnpm lint && pnpm build")

    return 1 if failed or (strict and stale) else 0


if __name__ == "__main__":
    sys.exit(main())
