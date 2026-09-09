"""Design-system audit for xForge. Run from the repo root:

    python .claude/skills/xforge-design-system/scripts/audit.py       # -v lists every hit
                                                                     # --strict also fails on DOWN
                                                                     # --selftest proves each check red

There is no test framework in this repo, so these checks are the de facto suite. The script exits
non-zero when any count is above its budget, which makes it a gate rather than a ritual.

Budgets are a ratchet, not a target. Where the number is already zero it must stay zero; where the
repo carries inherited debt the budget is today's count, so the number can only go down. Lower a
budget when you clear something -- that is the whole mechanism. `--strict` fails when a count has
improved and the budget is stale, so CI forces the update instead of trusting a habit.

Scope is `src/views`, `src/app`, `src/components/shared`. `src/components/ui` is out of scope for
every check because it tracks upstream shadcn; a palette colour or a raw <button> there is
upstream's decision, and rewriting it is the "edit, do not redraw" failure the skill warns about.
Every code count in SKILL.md is measured over exactly this tree, so the numbers are comparable.

A check that has never gone red is decoration -- so `--selftest` runs every check against a fixture
built to trip it, and fails if any check stays green. That is the rule enforced rather than asserted.

Calibration notes, 2026-09-06. Each of these was measured, not assumed:
  - `white` and `black` ignore the theme exactly as much as `slate-200`, so they count. All 16 of
    today's palette hits are white/black in inherited template views; zero are named ramps.
  - The faked-title check matches a bold span at *title* scale (sm/base/lg). Matching any bold span
    reported 4, and 3 were `text-2xl` metric values inside a CardHeader -- the precise failure this
    check's own comment warns about.
  - Intl and clock checks fire only on SERVER components. Measured over all components they report
    17 and 33, and effectively every hit is correct code: `'use client'` files, and pages reading
    the clock once, which is what the skill prescribes. Narrowed to server components they report
    1 and 0, and that 1 is a real hydration bug.
  - The tag-bounded exclusion replaced a 400-char window that could swallow the next element's
    `type='file'`. Verified: it changes no count in this tree today, 25 either way, but the fixture
    in `--selftest` is the case where the window version was wrong.
  - A "CardTitle re-declaring its own type" check was tried and rejected: it reports 79, which is
    every CardTitle in the app. That is the house pattern, not debt. Reverse this decision if
    `text-lg` ever moves into the primitive, at which point those 79 call sites become real drift.
"""

import os
import re
import sys
from datetime import date

SCOPE = ("src/views", "src/app", "src/components/shared")

Q = r"['\"]"  # JSX quote style is not pinned in this repo; never hardcode one.

PALETTE = re.compile(
    r"\b(bg|text|border|ring|fill|stroke|from|via|to|divide|outline|shadow|accent|caret"
    r"|decoration|placeholder)(-(t|r|b|l|x|y|s|e|tl|tr|bl|br))?-"
    r"((red|green|blue|yellow|orange|purple|pink|gray|slate|zinc|sky|emerald|amber|teal|indigo"
    r"|violet|rose|lime|cyan|fuchsia|stone|neutral)-[0-9]{2,3}|white|black)\b"
)
COMMENT_LINE = re.compile(r"^\s*(\*|//)")
HEX = re.compile(r"#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")
CARD_HEADER = re.compile(r"<CardHeader\b[^>]*>(.*?)</CardHeader>", re.S)
CARD_ACTION = re.compile(r"<CardAction\b[^>]*>.*?</CardAction>", re.S)
FAKE_TITLE = re.compile(rf"<span\s+className={Q}[^'\"]*\btext-(sm|base|lg)\b[^'\"]*\bfont-semibold\b")
RAW_ELEMENT = re.compile(r"<(button|input)[\s/>]")
RAW_ALLOWED = re.compile(rf"type={Q}file{Q}|getInputProps")
NESTED_LINK = re.compile(r"<Link[^>]*>\s*<Button", re.S)
# Counts the compliant wrapper too, so adopting SectionCardTitle cannot silently zero the count.
CARD_TITLE = re.compile(r"<(CardTitle|SectionCardTitle)(\s[^>]*)?>", re.S)
INTL_FORMAT = re.compile(r"\bIntl\.(DateTimeFormat|NumberFormat)\b|\btoLocale(Date|Time)?String\b")
CLOCK = re.compile(r"\bnew Date\(\s*\)|\bDate\.now\(\)")
# A hand-rolled aria-sort is the failure the shared helper exists to prevent, and counting the files
# that USE the helper cannot see it.
ARIA_SORT_INLINE = re.compile(r"aria-sort=(?!\{ariaSortFor)")
USE_CLIENT = re.compile(r"""^\s*['"]use client['"]""", re.M)

_CACHE = None


def sources():
    """Walk the scope once and cache. Each check previously meant another full pass."""
    global _CACHE

    if _CACHE is None:
        found = []

        for root in SCOPE:
            for folder, _, files in os.walk(root):
                for name in sorted(files):
                    if name.endswith(".tsx"):
                        path = os.path.join(folder, name).replace(os.sep, "/")

                        with open(path, encoding="utf-8") as fh:
                            found.append((path, fh.read()))

        _CACHE = found

    return _CACHE


def is_client(text):
    return bool(USE_CLIENT.search(text[:400]))


def tag_text(text, start):
    """The source of one JSX opening tag, quote- and brace-aware.

    A fixed-width window is wrong in both directions: it truncates a long tag, and it reads into the
    NEXT element, which can suppress a real violation sitting near a legitimate hidden file input.
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


def by_line(docs, pattern, skip_comments=False, only=None):
    hits = []

    for path, text in docs:
        if only and not only(path, text):
            continue

        for n, line in enumerate(text.splitlines(), 1):
            if skip_comments and COMMENT_LINE.match(line):
                continue
            if pattern.search(line):
                hits.append(f"{path}:{n}")

    return hits


def by_match(docs, pattern, keep=None):
    hits = []

    for path, text in docs:
        for m in pattern.finditer(text):
            if keep is None or keep(text, m):
                hits.append(f"{path}:{line_of(text, m.start())}")

    return hits


# --- checks -------------------------------------------------------------------------------------
# Each takes the document list and returns hits, so --selftest can hand it fixtures instead.


def palette_colours(docs):
    """Palette colours that should be semantic tokens. `white`/`black` count: they ignore the theme.

    Only full-line comments are skipped, so a file documenting why it avoided a palette colour is
    not reported for naming one. Deliberately not a parser.
    """
    return by_line(docs, PALETTE, skip_comments=True)


def hardcoded_hex(docs):
    return by_line(docs, HEX)


def faked_card_titles(docs):
    """A bold span at title scale standing in for CardTitle, inside a CardHeader.

    Scale is the discriminator: `text-2xl font-semibold` in a header is a metric value, which is a
    legitimate pattern here, and matching it made this check cry wolf on three stat cards.
    """
    hits = []

    for path, text in docs:
        for m in CARD_HEADER.finditer(text):
            if FAKE_TITLE.search(CARD_ACTION.sub("", m.group(1))):
                hits.append(f"{path}:{line_of(text, m.start())}")

    return hits


def raw_elements(docs):
    """Raw <button>/<input> where a primitive exists, excluding hidden and library-owned inputs."""
    return by_match(docs, RAW_ELEMENT, lambda t, m: not RAW_ALLOWED.search(tag_text(t, m.start())))


def nested_link_button(docs):
    """A Link wrapping a Button -- an anchor inside a button. Use render + nativeButton={false}."""
    return by_match(docs, NESTED_LINK)


def card_titles_not_headings(docs):
    """Card section titles outside the document outline. See "A card title is not a heading"."""
    return by_match(docs, CARD_TITLE, lambda t, m: "role=" not in (m.group(2) or ""))


def intl_in_server_component(docs):
    """Intl / toLocaleString in a component that is NOT 'use client'.

    Node and the browser ship different ICU builds, so a server-rendered locale format is a
    hydration mismatch. In a client component it is merely a choice, which is why this is scoped.
    """
    return by_line(docs, INTL_FORMAT, skip_comments=True, only=lambda p, t: not is_client(t))


def clock_in_server_view(docs):
    """new Date() / Date.now() in a server-rendered view component.

    A page may read the clock once and pass the value down -- the skill prescribes exactly that --
    so `src/app` is excluded. A view rendering on the server must not.
    """
    return by_line(
        docs,
        CLOCK,
        skip_comments=True,
        only=lambda p, t: not is_client(t) and not p.startswith("src/app/"),
    )


def inline_aria_sort(docs):
    """aria-sort not coming from the shared helper -- the copy the helper exists to prevent."""
    return by_line(docs, ARIA_SORT_INLINE)


CHECKS = (
    # (name, function, budget) -- every budget here was measured on 2026-09-06, not guessed.
    ("palette colours instead of semantic tokens (inherited: white/black)", palette_colours, 16),
    ("hardcoded hex", hardcoded_hex, 0),
    ("card headers faking a title (inherited)", faked_card_titles, 1),
    ("Link wrapping a Button", nested_link_button, 0),
    ("aria-sort not from the shared helper", inline_aria_sort, 0),
    ("Intl / toLocaleString in a server component", intl_in_server_component, 1),
    ("clock read in a server view component", clock_in_server_view, 0),
    ("raw <button>/<input> (inherited, AdminCN template views)", raw_elements, 25),
    ("card titles not in the document outline (inherited)", card_titles_not_headings, 70),
)

# --- self test ----------------------------------------------------------------------------------
# One fixture per check, written to trip exactly that check. If a fixture stops tripping, the check
# has rotted, and the clean result it reports on the real tree cannot be trusted.

FIXTURES = {
    "palette colours instead of semantic tokens (inherited: white/black)": [
        ("fixture.tsx", "<p className='border-t-red-500 bg-white text-black'>x</p>")
    ],
    "hardcoded hex": [("fixture.tsx", "const a = '#fff'\nconst b = '#FFAA0080'\nconst c = '#1a2b3c'")],
    "card headers faking a title (inherited)": [
        ("fixture.tsx", '<CardHeader><span className="text-lg font-semibold">Faked</span></CardHeader>')
    ],
    "Link wrapping a Button": [("fixture.tsx", "<Link href='/x'>\n  <Button>Go</Button>\n</Link>")],
    "aria-sort not from the shared helper": [("fixture.tsx", "<th aria-sort='ascending'>Name</th>")],
    "Intl / toLocaleString in a server component": [
        ("fixture.tsx", "export const S = () => <p>{(1).toLocaleString('en-US')}</p>")
    ],
    "clock read in a server view component": [
        ("src/views/fixture.tsx", "export const S = () => <p>{new Date().toISOString()}</p>")
    ],
    # A raw <button> next to a legitimate hidden file input: the old 400-char window reached the
    # input's type='file' and suppressed the button. Tag-bounded must report the button and the
    # self-closing <input/>, and must NOT report the hidden file input.
    "raw <button>/<input> (inherited, AdminCN template views)": [
        (
            "fixture.tsx",
            "<button onClick={save}>Save</button>\n<input type='file' ref={r} hidden />\n<input/>",
        )
    ],
    "card titles not in the document outline (inherited)": [
        ("fixture.tsx", "<CardTitle>Bare</CardTitle>\n<SectionCardTitle>Also bare</SectionCardTitle>")
    ],
}

# Where a fixture should trip a check more than once, say so, so a partial match cannot pass.
EXPECTED = {
    "raw <button>/<input> (inherited, AdminCN template views)": 2,
    "card titles not in the document outline (inherited)": 2,
}


def selftest():
    print("self-test: every check must go red on a fixture built to trip it\n")
    bad = 0

    for name, fn, _ in CHECKS:
        docs = FIXTURES.get(name)

        if docs is None:
            print(f"  [MISS ] no fixture          {name}")
            bad += 1
            continue

        got = len(fn(docs))
        want = EXPECTED.get(name, 1)
        ok = got >= want

        print(f"  [{'red  ' if ok else 'GREEN'}] {got:>2} hit(s), want >={want}   {name}")

        if not ok:
            bad += 1

    print()

    if bad:
        print(f"{bad} check(s) did not fire. They cannot be trusted on the real tree.")
    else:
        print("Every check fired. A clean board from this script means something.")

    return 1 if bad else 0


def check_scope():
    """Refuse to report on a tree that is not there.

    Without this, running from the wrong directory printed a perfect green board, exited 0, and
    invited you to lower every budget -- which would have destroyed the ratchet permanently.
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


def main():
    argv = sys.argv[1:]

    if "--selftest" in argv:
        return selftest()

    verbose = "-v" in argv or "--verbose" in argv
    strict = "--strict" in argv

    if not check_scope():
        return 2

    docs = sources()

    print(f"xForge design-system audit, {date.today().isoformat()}")
    print(f"scope: {', '.join(SCOPE)}  ({len(docs)} tsx files)\n")

    failed = stale = 0

    for name, fn, budget in CHECKS:
        hits = fn(docs)
        count = len(hits)

        if count > budget:
            mark = "FAIL"
            failed += 1
        elif count == budget:
            mark = "ok  "
        else:
            mark = "DOWN"
            stale += 1

        print(f"  [{mark}] {count:>3} / {budget:<3}  {name}")

        if hits and (verbose or mark == "FAIL"):
            for hit in hits[:20]:
                print(f"          {hit}")
            if count > 20:
                print(f"          ... and {count - 20} more")

    print()

    if failed:
        print(f"{failed} check(s) above budget. Fix, or justify and raise the budget deliberately.")
    if stale:
        word = "fails" if strict else "does not fail"
        print(f"{stale} count(s) came DOWN -- lower the budget here. --strict {word} on this.")
    if not (failed or stale):
        print("All checks at budget.")

    print("\nThen the real gates:  pnpm check-types && pnpm lint && pnpm build")

    return 1 if failed or (strict and stale) else 0


if __name__ == "__main__":
    sys.exit(main())
