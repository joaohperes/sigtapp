import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatCodigo } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'

export function SearchBar({ onSearch, loading, initialValue = '', recentSearches = [], onSelectRecent, suggestions = [] }) {
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function handleChange(e) {
    const v = e.target.value
    setValue(v)
    setOpen(v.trim().length >= 2)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(v), 400)
  }

  function handleClear() {
    setValue('')
    setOpen(false)
    onSearch('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') setOpen(false)
  }

  function selectRecent(term) {
    setValue(term)
    setOpen(false)
    onSelectRecent?.(term)
    onSearch(term)
  }

  const showSuggestions = open && value.trim().length >= 2 && suggestions.length > 0

  return (
    <div className="w-full" ref={wrapperRef}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          {loading ? (
            <svg className="h-5 w-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        <input
          type="text"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onFocus={() => { if (value.trim().length >= 2 && suggestions.length > 0) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por nome, código ou CID  (ex: colecistectomia, 0407010005, J94)"
          className="w-full rounded-xl border-0 bg-white/95 py-4 pl-12 pr-10
                     text-sm shadow-[0_4px_24px_rgba(0,0,0,0.25)] placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-0
                     transition-shadow duration-200"
        />

        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}

        {/* Dropdown de sugestões */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
            {suggestions.map((proc) => {
              const estilo = GRUPO_MAP[proc.co_procedimento?.slice(0, 2)]
              return (
                <Link
                  key={proc.co_procedimento}
                  to={`/procedimento/${proc.co_procedimento}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 first:pt-3 last:pb-3"
                >
                  {estilo && <div className={`h-6 w-1 shrink-0 rounded-full ${estilo.dot}`} />}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] text-slate-400">{formatCodigo(proc.co_procedimento)}</p>
                    <p className="truncate text-sm font-medium text-slate-800">{proc.no_procedimento}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {!value && recentSearches.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-white/60">Recentes:</span>
          {recentSearches.map((term) => (
            <button
              key={term}
              onClick={() => selectRecent(term)}
              className="rounded-full bg-white/15 px-3 py-1 text-xs text-white/90
                         hover:bg-white/25 transition"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
