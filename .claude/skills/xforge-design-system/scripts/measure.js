// Page measurements for the xForge design system skill.
// Paste into `javascript_tool` on the page under review. Run it in BOTH themes.
//
// Why a script and not eyeballing a screenshot: most of these numbers cannot be read off an image,
// and the one time this repo shipped a flat-looking dashboard it passed every code check.
//
// Fixed 2026-09-06:
//   - tally('gap') was swamped by the computed value `normal`, which every non-flex element
//     reports and the old filter let through. The gap tally was noise.
//   - scrollIntoView raced `scroll-behavior: smooth`: the rect on the next line was read before
//     the scroll finished, so ink sampled the wrong strip. behavior:'instant' now.
//   - the sticky header and fixed sidebar deflated every ink score. An occluded sample point was
//     counted as air rather than as unmeasurable.
//   - `largest` measured display:none elements, so a `hidden lg:block` responsive duplicate won
//     the type-scale reading at the wrong viewport.
//   - renderedOk was computed after all the expensive work instead of gating it.
//
// Known bias, deliberately not fixed: ink counts a text element's whole box, including line-height
// leading and padding, so a text-heavy card scores above a chart card for the same visual density.
// The number is comparative between peer screens, not absolute.

;

(() => {
  const root = document.querySelector('main main') || document.querySelector('main')

  if (!root) return { renderedOk: false, why: 'no <main> — wrong page, or the shell never mounted' }

  const cards = [...root.querySelectorAll('[data-slot=card]')]
  const renderedOk = cards.length > 0 && cards[0].getBoundingClientRect().width > 0

  // Gate before measuring, not after. In dev, Next streams server HTML inside a <div hidden> and
  // promotes it on hydration; when hydration fails the nodes stay queryable, innerText is nearly
  // empty and every rect is 0x0 — so the numbers come back plausible and are entirely fictional.
  if (!renderedOk) {
    return {
      renderedOk: false,
      cards: cards.length,
      why: 'measured a shell, not a page. Open a fresh tab; if it still fails, restart the dev server.'
    }
  }

  const html = document.documentElement

  const theme = html.classList.contains('dark')
    ? 'dark'
    : html.getAttribute('data-theme') || getComputedStyle(html).colorScheme || 'light'

  const els = [...root.querySelectorAll('*')]

  const visible = el => {
    const r = el.getBoundingClientRect()

    return r.width > 0 && r.height > 0
  }

  const isLeaf = el => !el.children.length && el.textContent.trim()

  // --- colour normalisation -------------------------------------------------------------------
  // Colour must go through a canvas before you can ask anything about it. This theme computes to
  // lab()/oklch(), not rgb() — a naive /\d+/ parse reads "lab(15.204 0 0)" (pure grey) as
  // [15, 204, 0] and calls every grey on the page tinted. That mistake scored a flat page at 47.
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })

  const rgba = css => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)

    return [...ctx.getImageData(0, 0, 1, 1).data]
  }

  const hasHue = css => {
    const [r, g, b, a] = rgba(css)

    return a >= 8 && Math.max(r, g, b) - Math.min(r, g, b) > 10
  }

  const bg = el => getComputedStyle(el).backgroundColor

  // Count a tint once. A tinted card holding a tinted badge is two elements but one design
  // decision, and counting both is what turns a budget of "about a dozen" into a meaningless 47.
  const tinted = els.filter(
    el => hasHue(bg(el)) && (!el.parentElement || bg(el) !== bg(el.parentElement))
  ).length

  // --- type scale -----------------------------------------------------------------------------
  // Only leaves that actually occupy space. getComputedStyle still reports a font size on a
  // display:none node, so without the rect check a mobile-only heading wins at desktop width.
  let px = 0
  let label = ''

  for (const el of els) {
    if (!isLeaf(el) || !visible(el)) continue
    const size = parseFloat(getComputedStyle(el).fontSize)

    if (size > px) [px, label] = [size, el.textContent.trim().slice(0, 30)]
  }

  // --- ink per card ---------------------------------------------------------------------------
  // Sample what is visible at each point rather than summing leaf rectangles. Summing was the
  // original approach and it is wrong: leaf boxes overlap, so the total exceeds the card and air
  // reads as ink. Measured on /payroll it returned 1.96 for a ratio whose ceiling is 1.
  const inkOf = (card, step = 6) => {
    card.scrollIntoView({ block: 'center', behavior: 'instant' })
    const box = card.getBoundingClientRect()
    const top = Math.max(box.top + 2, 2)
    const bottom = Math.min(box.bottom - 2, window.innerHeight - 2)

    if (box.width <= 0 || bottom <= top) return null

    let hits = 0
    let total = 0
    let occluded = 0

    for (let y = top; y < bottom; y += step) {
      for (let x = box.left + 2; x < box.right - 2; x += step) {
        const el = document.elementFromPoint(x, y)

        // The app has a sticky header and a fixed sidebar. A point they cover is unmeasurable,
        // not empty — counting it in the denominator reported real cards as mostly air.
        if (!el || !card.contains(el)) {
          occluded++
          continue
        }

        total++
        const tag = el.tagName.toLowerCase()

        if (tag === 'img' || tag === 'svg' || tag === 'path' || tag === 'canvas') hits++
        else if (isLeaf(el)) hits++
      }
    }

    return {
      ratio: total ? +(hits / total).toFixed(2) : null,

      // If this is a large share of the card, the reading is thin and the viewport is the problem.
      occludedPct: total + occluded ? +(occluded / (total + occluded)).toFixed(2) : null
    }
  }

  const ink = cards.map(card => ({
    title: (card.querySelector('[data-slot=card-title]')?.textContent ?? '(untitled)').slice(0, 30),
    ...inkOf(card)
  }))

  window.scrollTo(0, 0)

  // --- contrast -------------------------------------------------------------------------------
  // The quality floor calls 4.5:1 / 3:1 non-negotiable, so it should be measured rather than
  // asserted. Composites the real background by walking up through transparent ancestors, which
  // is what a /10 or /15 token tint requires — the tint is not the colour behind the text.
  const relLum = ([r, g, b]) => {
    const f = c => {
      const s = c / 255

      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }

    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }

  const over = ([r, g, b, a], base) => {
    const al = a / 255

    return [r * al + base[0] * (1 - al), g * al + base[1] * (1 - al), b * al + base[2] * (1 - al)]
  }

  const pageBase = (() => {
    const [r, g, b, a] = rgba(getComputedStyle(document.body).backgroundColor)

    return a >= 255 ? [r, g, b] : theme === 'dark' ? [0, 0, 0] : [255, 255, 255]
  })()

  const effectiveBg = el => {
    const layers = []
    let node = el

    while (node && node !== document.documentElement) {
      const c = rgba(getComputedStyle(node).backgroundColor)

      if (c[3] > 0) {
        layers.push(c)
        if (c[3] >= 255) break
      }

      node = node.parentElement
    }

    return layers.reduceRight((base, layer) => over(layer, base), pageBase)
  }

  const ratio = (fg, base) => {
    const [hi, lo] = [relLum(fg), relLum(base)].sort((a, b) => b - a)

    return +((hi + 0.05) / (lo + 0.05)).toFixed(2)
  }

  // Finish, do not wait. Colour transitions must be at their end value before any colour is read:
  // straight after a theme toggle getComputedStyle returns interpolated colours mid-fade, and text
  // briefly reads as the same colour as its background. That produced 95 phantom failures on a page
  // whose real count is 32. Waiting is not an option -- this app registers ~250 colour transitions
  // on a theme change and they do not all report settled -- so force them to their end state.
  for (const a of document.getAnimations ? document.getAnimations() : []) {
    try {
      a.finish()
    } catch {
      // an infinite or idle animation refuses; it is not a colour transition, so it does not matter
    }
  }

  // Colour transitions must have finished. Run this straight after a theme toggle and
  // getComputedStyle returns interpolated colours mid-fade -- text briefly reads as the same colour
  // as its background. That produced 95 phantom failures on a page whose real count is 32. If
  // `transitionsSettled` is false the contrast numbers are fiction; wait and run it again.
  const transitionsSettled =
    typeof document.getAnimations !== 'function' ||
    document.getAnimations().every(a => a.playState !== 'running')

  const contrast = []

  for (const el of els) {
    if (!isLeaf(el) || !visible(el)) continue
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize)
    const weight = parseInt(cs.fontWeight, 10) || 400
    const large = size >= 24 || (size >= 18.66 && weight >= 700)
    const base = effectiveBg(el)
    const r = ratio(over(rgba(cs.color), base), base)
    const need = large ? 3 : 4.5

    if (r < need) {
      contrast.push({
        ratio: r,
        need,
        size: `${size}px/${weight}`,
        text: el.textContent.trim().slice(0, 40)
      })
    }
  }

  contrast.sort((a, b) => a.ratio - b.ratio)

  // --- tabular numerals -----------------------------------------------------------------------
  // The skill records this as already the practice but living per call site, "one forgotten class
  // away from drifting". Scoped to table cells because the rule is about figures in a COLUMN:
  // a number in prose does not need to line up under anything.
  const NUMERIC = /^[\s$€£¥₫₹+\-(]*\d[\d.,\s]*\)?%?$/
  const numeric = []

  for (const cell of root.querySelectorAll('td, [role=cell], [role=gridcell]')) {
    for (const el of [cell, ...cell.querySelectorAll('*')]) {
      if (!isLeaf(el) || !visible(el)) continue
      const text = el.textContent.trim()

      if (!NUMERIC.test(text) || !/\d/.test(text)) continue

      if (!getComputedStyle(el).fontVariantNumeric.includes('tabular-nums')) {
        numeric.push(text.slice(0, 24))
      }
    }
  }

  // --- pointer targets ------------------------------------------------------------------------
  // The house rule takes none of WCAG 2.5.8's exemptions, so inline links inside a sentence will
  // appear here. That is the stated policy, not a bug in the check — judge each one.
  const INTERACTIVE =
    'a[href], button, input, select, textarea, [role=button], [role=link], [role=menuitem],' +
    '[role=tab], [role=checkbox], [role=switch], [role=radio], [tabindex]:not([tabindex="-1"])'

  const targets = []
  const inlineLinks = []

  // An inline link inside a sentence or a table cell is the one WCAG 2.5.8 exemption this repo
  // takes, because the alternative is a 24px-tall line of prose. Reported separately so the
  // actionable number stays actionable: `smallTargets` is standalone controls only.
  const isInlineLink = el =>
    el.tagName === 'A' && getComputedStyle(el).display.startsWith('inline')

  for (const el of root.querySelectorAll(INTERACTIVE)) {
    const r = el.getBoundingClientRect()

    if (r.width <= 0 || r.height <= 0) continue

    // Base UI renders a visually-hidden native input behind Checkbox, Radio and Switch; the real
    // target is the styled wrapper, which is full size. Reporting the 1x1 proxy sent you to fix a
    // control that was never small. Anything this size or transparent is a proxy, not a target.
    const cs = getComputedStyle(el)

    if ((r.width <= 2 && r.height <= 2) || cs.opacity === '0' || cs.clipPath === 'inset(50%)') continue

    // A ::after with negative insets is this repo's way of growing a small control's hit area --
    // Checkbox is size-4 (16px) with after:-inset-x-3 after:-inset-y-2, so the box you can click is
    // 40x32 even though the rect says 16x16. Measure the target, not the paint.
    const after = getComputedStyle(el, '::after')
    let w = r.width
    let h = r.height

    if (after.content && after.content !== 'none') {
      const px = v => (parseFloat(v) || 0)

      w += Math.max(0, -px(after.left)) + Math.max(0, -px(after.right))
      h += Math.max(0, -px(after.top)) + Math.max(0, -px(after.bottom))
    }

    if (w < 24 || h < 24) {
      ;(isInlineLink(el) ? inlineLinks : targets).push({
        size: `${Math.round(w)}x${Math.round(h)}`,
        el: el.tagName.toLowerCase(),
        text: (el.textContent.trim() || el.getAttribute('aria-label') || '').slice(0, 24)
      })
    }
  }

  // --- token conformance ----------------------------------------------------------------------
  // A page using eleven distinct radii or nine gaps is drifting off the scale. Measurable rather
  // than arguable, which is the point. Expect a handful of values, not a spectrum.
  const tally = (prop, filter) => {
    const counts = new Map()

    for (const el of els) {
      if (filter && !filter(el)) continue
      const v = getComputedStyle(el)[prop]


      // `normal` is the computed gap of every non-flex element. Letting it through made this
      // tally useless: one value with a count in the hundreds, drowning the real ones.
      if (!v || v === '0px' || v === 'none' || v.startsWith('normal')) continue

      // rounded-full computes to a ~2.2e7px radius. It is one deliberate shape, not scale drift,
      // and left raw it takes a slot in the top 8 and hides a real value.
      counts.set(parseFloat(v) > 500 ? 'full' : v, (counts.get(parseFloat(v) > 500 ? 'full' : v) ?? 0) + 1)
    }

    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }

  const laidOut = el => /flex|grid/.test(getComputedStyle(el).display)

  return {
    renderedOk,
    theme,

    // The four archetype diagnostics. Read them against the archetype you named, never as targets.
    largest: `${px}px — ${label}`,
    tinted,
    images: root.querySelectorAll('img, [data-slot=avatar]').length,
    ink,

    // Quality floor, measured rather than asserted.
    transitionsSettled,
    contrastFailures: contrast.length,
    contrastWorst: contrast.slice(0, 8),
    numbersMissingTabularNums: numeric.length,
    numbersSample: numeric.slice(0, 8),
    smallTargets: targets.length,
    smallTargetsSample: targets.slice(0, 8),
    smallInlineLinks: inlineLinks.length,

    // Outline. One h1 per page; card sections join the outline via role='heading'.
    headings: root.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
    h1: root.querySelectorAll('h1').length,
    cardTitles: root.querySelectorAll('[data-slot=card-title]').length,
    cards: cards.length,

    // Scale conformance.
    scrollsSideways: html.scrollWidth > window.innerWidth,
    radii: tally('borderRadius'),
    gaps: tally('gap', laidOut)
  }
})()
