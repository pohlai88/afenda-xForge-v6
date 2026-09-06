// Generates the favicon set from the same geometry as src/assets/svg/logo.tsx.
// Pure Node: rasterises the mark itself and encodes PNG via zlib, so no image deps.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// ---- geometry (must match src/assets/svg/logo.tsx) ----
const CENTRE = 16
const INNER_GAP = 0.35
const RAY_LENGTHS = [11.3, 7.9, 10.6, 8.5, 11, 7.5, 10.9, 8.8, 10.2, 7.7, 11.1]
const CENTRE_DISC_R = 1.05
const SQUIRCLE_R = 8.6
const BOX = 32

const buildRayPoints = (angleDeg, length) => {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const perpX = -sin
  const perpY = cos
  const width = 0.5 + length * 0.095
  const swell = length * 0.24

  const base = [CENTRE + cos * INNER_GAP, CENTRE + sin * INNER_GAP]
  const tip = [CENTRE + cos * length, CENTRE + sin * length]
  const sx = CENTRE + cos * swell
  const sy = CENTRE + sin * swell
  const ctrlA = [sx + perpX * width, sy + perpY * width]
  const ctrlB = [sx - perpX * width, sy - perpY * width]

  return { base, tip, ctrlA, ctrlB }
}

const f2 = n => n.toFixed(2)

const rayPath = (angleDeg, length) => {
  const { base, tip, ctrlA, ctrlB } = buildRayPoints(angleDeg, length)

  return `M${f2(base[0])} ${f2(base[1])} Q${f2(ctrlA[0])} ${f2(ctrlA[1])} ${f2(tip[0])} ${f2(tip[1])} Q${f2(ctrlB[0])} ${f2(ctrlB[1])} ${f2(base[0])} ${f2(base[1])} Z`
}

const angleFor = i => -90 + (360 / RAY_LENGTHS.length) * i

// Flatten each petal (two quadratic curves) into a polygon for point-in-shape tests.
const quad = (p0, c, p1, steps) => {
  const pts = []

  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t

    pts.push([mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * p1[0], mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * p1[1]])
  }

  return pts
}

const polygonFor = (angleDeg, length, widthFn) => {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const width = widthFn(length)
  const swell = length * 0.24
  const base = [CENTRE + cos * INNER_GAP, CENTRE + sin * INNER_GAP]
  const tip = [CENTRE + cos * length, CENTRE + sin * length]
  const sx = CENTRE + cos * swell
  const sy = CENTRE + sin * swell
  const ctrlA = [sx - sin * width, sy + cos * width]
  const ctrlB = [sx + sin * width, sy - cos * width]

  return [base, ...quad(base, ctrlA, tip, 20), ...quad(tip, ctrlB, base, 20)]
}

const FULL_WIDTH = len => 0.5 + len * 0.095

// Full-fidelity mark, used at 32px and above.
const RAY_POLYGONS = RAY_LENGTHS.map((len, i) => polygonFor(angleFor(i), len, FULL_WIDTH))

// At 16px the eleven needles collapse into a smudge — there simply are not enough pixels to
// separate them. The small variant keeps only the six long rays and thickens them, so the
// silhouette still reads as the same spark at a size where the detail cannot survive.
const SMALL_WIDTH = len => 0.75 + len * 0.135

const RAY_POLYGONS_SMALL = RAY_LENGTHS.map((len, i) => ({ len, i }))
  .filter(({ len }) => len >= 10)
  .map(({ len, i }) => polygonFor(angleFor(i), len, SMALL_WIDTH))

const pointInPoly = (x, y, poly) => {
  let inside = false

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }

  return inside
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

// Rounded rect: a point is inside when its distance to the inner (inset) rect is <= radius.
const inSquircle = (x, y) => {
  const cx = clamp(x, SQUIRCLE_R, BOX - SQUIRCLE_R)
  const cy = clamp(y, SQUIRCLE_R, BOX - SQUIRCLE_R)
  const dx = x - cx
  const dy = y - cy

  return dx * dx + dy * dy <= SQUIRCLE_R * SQUIRCLE_R
}

const inSpark = (x, y, polys) => {
  const dx = x - CENTRE
  const dy = y - CENTRE

  if (dx * dx + dy * dy <= CENTRE_DISC_R * CENTRE_DISC_R) return true
  for (const poly of polys) if (pointInPoly(x, y, poly)) return true

  return false
}

// linearGradient x1=0 y1=0 x2=32 y2=32, stops at 0 / 0.55 / 1
const STOPS = [
  { at: 0, rgb: [226, 140, 99] },
  { at: 0.55, rgb: [217, 119, 87] },
  { at: 1, rgb: [180, 85, 47] }
]

const gradientAt = (x, y) => {
  const t = clamp((x * BOX + y * BOX) / (BOX * BOX + BOX * BOX), 0, 1)

  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i].at) {
      const a = STOPS[i - 1]
      const b = STOPS[i]
      const k = (t - a.at) / (b.at - a.at)

      return [0, 1, 2].map(c => Math.round(a.rgb[c] + (b.rgb[c] - a.rgb[c]) * k))
    }
  }

  return STOPS[STOPS.length - 1].rgb
}

const SS = 4 // supersampling factor per axis

const rasterise = size => {
  const polys = size <= 20 ? RAY_POLYGONS_SMALL : RAY_POLYGONS
  const px = Buffer.alloc(size * size * 4)
  const scale = BOX / size

  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let hits = 0
      let r = 0
      let g = 0
      let b = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (pxi + (sx + 0.5) / SS) * scale
          const y = (py + (sy + 0.5) / SS) * scale

          if (!inSquircle(x, y)) continue
          hits++

          if (inSpark(x, y, polys)) {
            r += 255
            g += 255
            b += 255
          } else {
            const c = gradientAt(x, y)

            r += c[0]
            g += c[1]
            b += c[2]
          }
        }
      }

      const total = SS * SS
      const o = (py * size + pxi) * 4

      if (hits === 0) {
        px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0
      } else {
        px[o] = Math.round(r / hits)
        px[o + 1] = Math.round(g / hits)
        px[o + 2] = Math.round(b / hits)
        px[o + 3] = Math.round((hits / total) * 255)
      }
    }
  }

  return px
}

// ---- PNG encoding ----
let CRC_TABLE = null

const crcTable = () => {
  if (CRC_TABLE) return CRC_TABLE
  CRC_TABLE = new Int32Array(256)

  for (let n = 0; n < 256; n++) {
    let c = n

    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    CRC_TABLE[n] = c
  }

  return CRC_TABLE
}

const crc32 = buf => {
  const t = crcTable()
  let c = -1

  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8)

  return (c ^ -1) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)

  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)

  crc.writeUInt32BE(crc32(td))

  return Buffer.concat([len, td, crc])
}

const encodePng = (size, px) => {
  const ihdr = Buffer.alloc(13)

  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))

  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// ---- ICO (PNG-encoded entries, supported by every browser that matters) ----
const encodeIco = entries => {
  const dir = Buffer.alloc(6)

  dir.writeUInt16LE(0, 0)
  dir.writeUInt16LE(1, 2)
  dir.writeUInt16LE(entries.length, 4)
  let offset = 6 + entries.length * 16
  const dirEntries = []

  for (const e of entries) {
    const de = Buffer.alloc(16)

    de[0] = e.size >= 256 ? 0 : e.size
    de[1] = e.size >= 256 ? 0 : e.size
    de[2] = 0
    de[3] = 0
    de.writeUInt16LE(1, 4) // planes
    de.writeUInt16LE(32, 6) // bpp
    de.writeUInt32BE(0, 8)
    de.writeUInt32LE(e.png.length, 8)
    de.writeUInt32LE(offset, 12)
    dirEntries.push(de)
    offset += e.png.length
  }

  return Buffer.concat([dir, ...dirEntries, ...entries.map(e => e.png)])
}

// ---- emit ----
const APP = process.argv[2] ?? path.join(import.meta.dirname, '..', 'src', 'app')

const paths = RAY_LENGTHS.map((len, i) => rayPath(angleFor(i), len))

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="e" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E28C63"/>
      <stop offset="0.55" stop-color="#D97757"/>
      <stop offset="1" stop-color="#B4552F"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8.6" fill="url(#e)"/>
  <g fill="#fff">
${paths.map(d => `    <path d="${d}"/>`).join('\n')}
    <circle cx="16" cy="16" r="1.05"/>
  </g>
</svg>
`

fs.writeFileSync(path.join(APP, 'icon.svg'), svg)
console.log('wrote icon.svg')

const icoSizes = [16, 32, 48]
const ico = encodeIco(icoSizes.map(size => ({ size, png: encodePng(size, rasterise(size)) })))

fs.writeFileSync(path.join(APP, 'favicon.ico'), ico)
console.log('wrote favicon.ico  (' + icoSizes.join('/') + 'px,', ico.length, 'bytes)')

const apple = encodePng(180, rasterise(180))

fs.writeFileSync(path.join(APP, 'apple-icon.png'), apple)
console.log('wrote apple-icon.png (180px,', apple.length, 'bytes)')
