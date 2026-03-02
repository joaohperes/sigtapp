import { useState, useRef, useEffect } from 'react'

export function SearchBar({ onSearch, loading, initialValue = '', recentSearches = [], onSelectRecent }) {
  const [value, setValue] = useState(initialValue)
  const [showRecent, setShowRecent] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (!containerRef.current?.contains(e.target)) setShowRecent(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e) {
    const v = e.target.value
    setValue(v)
    setShowRecent(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(v), 400)
  }

  function handleFocus() {
    if (!value && recentSearches.length > 0) setShowRecent(true)
  }

  function handleClear() {
    setValue('')
    setShowRecent(recentSearches.length > 0)
    onSearch('')
  }

  function selectRecent(term) {
    setValue(term)
    setShowRecent(false)
    onSelectRecent?.(term)
    onSearch(term)
  }

  return (
    <div className="relative w-full" ref={containerRef}>
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
        onFocus={handleFocus}
        placeholder="Buscar por nome, código ou CID  (ex: colecistectomia, 0407010005, J94)"
        className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-10
                   text-sm shadow-sm placeholder:text-gray-400
                   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

      {showRecent && recentSearches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Buscas recentes
          </p>
          {recentSearches.map((term) => (
            <button
              key={term}
              onMouseDown={(e) => { e.preventDefault(); selectRecent(term) }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
