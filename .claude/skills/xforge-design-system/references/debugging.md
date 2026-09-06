# Debugging and verification

Read this before diagnosing a UI bug, and before trusting anything you measured in a browser.

Every entry below is a defect that actually shipped into a session in this repo, cost real time,
and would have been avoided by knowing one fact. None of it is generic advice — the generic
material lives in the upstream skills named at the bottom, and this file deliberately does not
copy it, because those get maintained and a copy would rot.

## Contents

- [Before you trust a measurement](#before-you-trust-a-measurement)
- [When the browser stops responding](#when-the-browser-stops-responding)
- [Base UI facts that have already bitten](#base-ui-facts-that-have-already-bitten)
- [React 19 in this repo](#react-19-in-this-repo)
- [Lint and formatter loops](#lint-and-formatter-loops)
- [Where the real authorities are](#where-the-real-authorities-are)

## Before you trust a measurement

**Check `renderedOk` first.** `scripts/measure.js` returns it and gates on it. When it is false you
measured a shell, and every number under it is fiction.

**There are usually two copies of the page in the DOM.** In dev, Next streams the server HTML inside
a `<div hidden>` under `<body>` and promotes it on hydration. Both copies are queryable. The hidden
one has `innerText` nearly empty and every rect `0x0`.

This produced a whole session of wrong readings: 24 rows where 12 exist, 18 sortable headers where
there are 9, two paginations, and a `Shift+F10` that did nothing because the focused node was in the
copy nobody can see. It is *not* a duplicate render and not a bug to fix — an unmigrated page shows
it too.

So every DOM query in a running page filters to the visible tree:

```js
const visible = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().height > 0)
```

Never `document.querySelectorAll('[data-row]')` across the page. That is also the Phase 02 table
invariant: a mounted but inactive table must not participate in keyboard, focus, selection or
context-menu targeting, and Base UI `Tabs` keeps inactive panels mounted, so this is two independent
reasons for the same rule.

## When the browser stops responding

The Chrome automation channel degrades mid-session, and it degrades *silently* — the tool reports
the click or keypress as sent.

- **Keys stop arriving.** `keydown` listeners record nothing for `Shift+F10`, `ArrowDown`, even
  `Tab`, while `document.hasFocus()` is `true`. Sometimes a real click into the page restores it
  (the window can lack OS focus, which shows as `hasFocus() === false`); often it does not.
- **Pointer clicks miss.** The page scrolls between the call that measures coordinates and the call
  that clicks. Measure and click in adjacent calls, and re-measure after any `scrollIntoView`.
- **Synthetic events are ignored by triggers.** `dispatchEvent(new MouseEvent('contextmenu'))` does
  not open a Base UI menu; only a trusted event does. But `element.click()` on a menu *item* works,
  because that is an ordinary React `onClick` — which is how you drive a menu the harness cannot
  open.

**Before calling a control broken, run the same interaction against an existing shipped control of
the same kind.** This is the rule that matters. A session concluded "the ⋮ button is broken" and was
wrong — the untouched `apps/users/list` ellipsis failed identically, so it was the harness. The
control was fine and shipped later with no change.

When it fails, prefer evidence the harness can still produce — DOM structure, ARIA attributes,
computed geometry, `getBoundingClientRect` baselines, and listeners logging `isTrusted` — and hand
genuine keyboard acceptance to the user as an explicit manual check. Report the gate NOT VERIFIED.
Construction evidence is never a PASS.

Two smaller traps: the JS tool refuses any result containing query-string data, so never return
`location.search`. And Chrome window resize is ignored here — probe narrow layouts with an iframe at
the target width and read `documentElement.scrollWidth` against `innerWidth`.

## Base UI facts that have already bitten

`@base-ui/react` is on **1.6.0** here. The installed `base-ui` skill is written at 1.8.0, so treat
anything it marks 1.7.0+ as unavailable until the package is upgraded.

| Symptom | Fact |
|---|---|
| Page crashes into the error boundary on menu open | `Menu.GroupLabel` (`ContextMenuLabel`, `DropdownMenuLabel`) requires a `Menu.Group` ancestor. A label naming the whole menu is not a group label — render a plain `div` and put the name on the popup's `aria-label`. |
| `TS2322` on a select-all checkbox | Base UI `Checkbox` takes `indeterminate` as its own prop. It is not `checked='indeterminate'`. |
| Menu opens from `Shift+F10` but arrows do nothing | `Menu.Popup` exposes `finalFocus` (close-time) and no `initialFocus`. The browser already dispatches a trusted `contextmenu` on the focused element, and `onContextMenu` is a React prop on the trigger, so it bubbles from the row's own anchor — but focus stays on the trigger and the menu is undriveable until something moves it into the popup. |
| A menu item activates the row underneath it | Portalled content still bubbles through the **React** tree. A `DropdownMenu` rendered inside a row's cell sends its item clicks to the row's `onClick`. Any row-activation guard must ignore `[role=menu]`, `[role=menuitem]` and `[role=dialog]`, not just `button, a, input`. A `ContextMenu` is unaffected — its content is a sibling of the trigger, not a descendant. |
| A `render`-prop trigger drops behaviour | `render` replaces the element; new primitives compose `useRender` with `mergeProps`. Merging by hand drops the handlers Base UI needs. |

State arrives as data attributes — `data-open`, `data-highlighted`, `data-checked`. Never mirror it
into React state to branch on.

## React 19 in this repo

The two failures that recur are both about *when* something is evaluated, not about hooks.

**Eager evaluation of what used to be lazy JSX.** Moving a message out of a conditionally-rendered
branch into an object built every render turns a latent crash into a certain one. This exact shape
took a page down:

```tsx
// Was only evaluated when the table was empty. RUN_LIFECYCLE_LABELS['all'] is undefined.
message: `No runs are ${RUN_LIFECYCLE_LABELS[lifecycle].toLowerCase()}.`
```

When you lift JSX into a config object, re-check every expression for the case the old branch
never reached.

**Derived state in an effect**, and **event logic in an effect** — both covered in the main
SKILL.md. `useEffect` is the most reliable source of subtle UI bugs here.

## Lint and formatter loops

`@stylistic/lines-around-comment` wants a blank line before a comment; Prettier removes a blank line
in some positions. They fight forever.

Inside a **JSX props list this happens anywhere, not only at the top** — a `//` comment between two
props loops the same way, and editing an existing commented prop is enough to trigger it, because
Prettier drops the blank line the original file had and lint then demands it back.

The fix is never to negotiate with it: hoist the handler into a named `const` above the JSX with the
comment above *that*. See `[[prettier-strips-leading-block-comment-blank-line]]` for the full note.

## Where the real authorities are

Reference, do not copy. These are maintained upstream.

| Need | Skill |
|---|---|
| Base UI parts, data attributes, hook returns | `base-ui` — mind the 1.8.0-vs-1.6.0 gap above |
| DOM inspection, console errors, network, profiling | `browser-testing-with-devtools` — a different transport from Chrome-in-Chrome, worth trying when that one dies |
| Hook semantics, dependencies, custom hooks | `react-hooks` |
| useEffect abuse, state-management smells, React 19 review | `typescript-react-reviewer` |
| Render and data-fetching performance | `vercel-react-best-practices` |

When one of them and this repo's SKILL.md disagree about how something should look or compose,
SKILL.md wins. On an API fact, they win.
