import * as React from 'react'

const MOBILE_BREAKPOINT = 1280

export function useIsMobile() {
  // Deliberately starts undefined rather than measuring the window here. A lazy initializer
  // runs during the first client render, where it would report the real width while the
  // server — having no window — assumed desktop. Below the breakpoint the two disagreed and
  // the sidebar hydrated as a Sheet over a server-rendered desktop rail, so React threw the
  // whole tree away and re-rendered on the client. Measuring in the effect below instead
  // keeps the first client render identical to the server's, then corrects after mount.
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    mql.addEventListener('change', onChange)
    onChange()

    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
