'use client'

// React Imports
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type RightPanelContextType = {
  rightPanelOpen: boolean
  toggleRightPanel: () => void
}

const RightPanelContext = createContext<RightPanelContextType>({
  rightPanelOpen: true,
  toggleRightPanel: () => {}
})

export const RightPanelProvider = ({ children }: { children: ReactNode }) => {
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  return (
    <RightPanelContext.Provider value={{ rightPanelOpen, toggleRightPanel: () => setRightPanelOpen(p => !p) }}>
      {children}
    </RightPanelContext.Provider>
  )
}

export const useRightPanel = () => useContext(RightPanelContext)
