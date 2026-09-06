// Regenerates public/images/og-image.png by screenshotting the running app.
//
//   pnpm build && pnpm start --port 3100     # in one terminal
//   pnpm og                                  # in another
//
// Screenshot the production build, not the dev server: dev renders a devtools indicator into
// the corner of the shot.
//
// Drives Chrome over the DevTools Protocol using Node's built-in WebSocket (Node 22+), so
// there is no puppeteer/playwright dependency. Chrome's own --screenshot flag is not enough
// here -- it fires on a virtual-time budget, which lands before the chart animations finish
// and produces a page full of empty cards. This waits real wall-clock time instead.
//
// Width matters: below the 1280px sidebar breakpoint the sidebar collapses and the shot loses
// all branding, so capture at 1600x840 (the same 1.905:1 ratio as the 1200x630 OG standard).
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
]

const url = process.argv[2] ?? 'http://localhost:3100/dashboard/sales'
const out = process.argv[3] ?? path.join(import.meta.dirname, '..', 'public', 'images', 'og-image.png')
const width = Number(process.argv[4] ?? 1600)
const height = Number(process.argv[5] ?? 840)
const scheme = process.argv[6] ?? 'dark'
const settleMs = Number(process.argv[7] ?? 9000)

const PORT = 9333
const sleep = ms => new Promise(r => setTimeout(r, ms))

const chromePath = CHROME_CANDIDATES.find(p => fs.existsSync(p))

if (!chromePath) {
  console.error('No Chrome or Edge found. Checked:\n  ' + CHROME_CANDIDATES.join('\n  '))
  process.exit(1)
}

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${(process.env.TEMP ?? '/tmp').replace(/\\/g, '/')}/xforge-og-profile`,
    `--window-size=${width},${height}`,
    'about:blank'
  ],
  { stdio: 'ignore' }
)

const waitForDevtools = async () => {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)

      if (r.ok) return
    } catch {
      /* not listening yet */
    }

    await sleep(250)
  }

  throw new Error('Chrome DevTools endpoint never came up')
}

const main = async () => {
  const probe = await fetch(url).catch(() => null)

  if (!probe || !probe.ok) {
    throw new Error(`${url} is not responding — start the app first (pnpm start --port 3100)`)
  }

  await waitForDevtools()

  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
  const page = targets.find(t => t.type === 'page')

  if (!page) throw new Error('no page target in Chrome')

  const ws = new WebSocket(page.webSocketDebuggerUrl)

  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', rej, { once: true })
  })

  let id = 0
  const pending = new Map()

  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data)

    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  })

  const send = (method, params = {}) =>
    new Promise(res => {
      const myId = ++id

      pending.set(myId, res)
      ws.send(JSON.stringify({ id: myId, method, params }))
    })

  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] })
  await send('Page.navigate', { url })
  await sleep(settleMs)

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })

  if (!shot.result?.data) throw new Error('Chrome returned no screenshot data')

  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
  console.log(`wrote ${out} (${width}x${height}, ${scheme}, ${fs.statSync(out).size} bytes)`)

  ws.close()
}

main()
  .then(() => {
    chrome.kill()
    process.exit(0)
  })
  .catch(e => {
    console.error('FAILED:', e.message)
    chrome.kill()
    process.exit(1)
  })
