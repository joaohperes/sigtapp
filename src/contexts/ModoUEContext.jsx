import { createContext, useContext, useState } from 'react'
import { toast } from 'sonner'

const ModoUEContext = createContext()

export function ModoUEProvider({ children }) {
  const [modoUE, setModoUE] = useState(() => {
    try { return localStorage.getItem('sigtap-modo-ue') === '1' } catch { return false }
  })

  function toggleModoUE() {
    setModoUE(v => {
      const next = !v
      localStorage.setItem('sigtap-modo-ue', next ? '1' : '0')
      if (next) {
        toast('Modo emergência ativado', {
          description: 'Exibindo apenas procedimentos clínicos (03) e cirúrgicos (04)',
          icon: '🚨',
          duration: 3000,
        })
      } else {
        toast('Modo emergência desativado', {
          description: 'Exibindo todos os grupos de procedimentos',
          duration: 2000,
        })
      }
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
