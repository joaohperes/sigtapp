import { createContext, useContext, useState } from 'react'

const ModoUEContext = createContext()

export function ModoUEProvider({ children }) {
  const [modoUE, setModoUE] = useState(() => {
    try { return localStorage.getItem('sigtap-modo-ue') === '1' } catch { return false }
  })

  function toggleModoUE() {
    setModoUE(v => {
      const next = !v
      localStorage.setItem('sigtap-modo-ue', next ? '1' : '0')
      return next
    })
  }

  return (
    <ModoUEContext.Provider value={{ modoUE, toggleModoUE }}>
      {children}
    </ModoUEContext.Provider>
  )
}

export function useModoUE() {
  return useContext(ModoUEContext)
}
