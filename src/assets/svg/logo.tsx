// React Imports
import type { SVGAttributes } from 'react'

const CENTRE = 16
const INNER_GAP = 0.35

// Eleven rays, evenly spaced but deliberately uneven in length. A prime count means no ray
// has an opposite twin, so the mark never reads as a symmetrical asterisk — it keeps the
// struck-spark feel at any rotation.
const RAY_LENGTHS = [11.3, 7.9, 10.6, 8.5, 11, 7.5, 10.9, 8.8, 10.2, 7.7, 11.1]

// A ray is a needle: it leaves the centre with its full body, reaches its widest a quarter of
// the way out, then runs to a point at the tip. Two quadratic curves, one per side. Swelling
// this close to the centre is what keeps it a struck spark rather than a flower.
const buildRay = (angleDeg: number, length: number) => {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // Unit vector perpendicular to the ray, used to push the control points sideways.
  const perpX = -sin
  const perpY = cos

  // Longer rays carry slightly more width so every petal reads at the same weight. The
  // constants are deliberately heavy: at 32px in the sidebar a finer petal collapses into a
  // grey smudge, so the mark is drawn to survive its smallest use rather than its largest.
  const width = 0.5 + length * 0.095
  const swell = length * 0.24

  const baseX = CENTRE + cos * INNER_GAP
  const baseY = CENTRE + sin * INNER_GAP
  const tipX = CENTRE + cos * length
  const tipY = CENTRE + sin * length
  const swellX = CENTRE + cos * swell
  const swellY = CENTRE + sin * swell

  const f = (n: number) => n.toFixed(2)

  return [
    `M${f(baseX)} ${f(baseY)}`,
    `Q${f(swellX + perpX * width)} ${f(swellY + perpY * width)} ${f(tipX)} ${f(tipY)}`,
    `Q${f(swellX - perpX * width)} ${f(swellY - perpY * width)} ${f(baseX)} ${f(baseY)}`,
    'Z'
  ].join(' ')
}

// Starts at -90deg so the longest ray points straight up.
const RAYS = RAY_LENGTHS.map((length, i) => buildRay(-90 + (360 / RAY_LENGTHS.length) * i, length))

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='1em' height='1em' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <defs>
        <linearGradient id='xforge-ember' x1='0' y1='0' x2='32' y2='32' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#E28C63' />
          <stop offset='0.55' stopColor='#D97757' />
          <stop offset='1' stopColor='#B4552F' />
        </linearGradient>
      </defs>

      {/* Squircle rather than a circle: it sits square against the app-icon grid the rest of
          the shell is built on, and leaves the corners quiet so the spark carries the mark. */}
      <rect width='32' height='32' rx='8.6' fill='url(#xforge-ember)' />

      <g fill='#FFFFFF'>
        {RAYS.map(d => (
          <path key={d} d={d} />
        ))}
        {/* The eleven petals converge on a point but do not quite close over it, leaving a
            pinprick of the squircle showing through. This seals the centre. */}
        <circle cx={CENTRE} cy={CENTRE} r='1.05' />
      </g>
    </svg>
  )
}

export default Logo
