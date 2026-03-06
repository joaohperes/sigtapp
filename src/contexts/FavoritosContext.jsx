import { createContext, useContext, useState, useCallback } from 'react'

const KEY = 'sigtap-favoritos'
const FavoritosContext = createContext(null)

export function FavoritosProvider({ children }) {
  const [favoritos, setFavoritos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  })

  const toggleFavorito = useCallback((procedure) => {
    setFavoritos(prev => {
      const exists = prev.some(f => f.co_procedimento === procedure.co_procedimento)
      const next = exists
        ? prev.filter(f => f.co_procedimento !== procedure.co_procedimento)
        : [{
            co_procedimento: procedure.co_procedimento,
            no_procedimento: procedure.no_procedimento,
            vl_sa: procedure.vl_sa,
            vl_sh: procedure.vl_sh,
            vl_sp: procedure.vl_sp,
            no_financiamento: procedure.no_financiamento,
          }, ...prev]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorito = useCallback(
    (co) => favoritos.some(f => f.co_procedimento === co),
    [favoritos]
  )

  return (
    <FavoritosContext.Provider value={{ favoritos, toggleFavorito, isFavorito }}>
      {children}
    </FavoritosContext.Provider>
  )
}

export function useFavoritos() {
  return useContext(FavoritosContext)
}
