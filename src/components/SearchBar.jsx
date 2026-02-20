import { useState, useRef } from 'react'

export function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('')
  const debounceRef = useRef(null)

  function handleChange(e) {
    const v = e.target.value
    setValue(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(v), 400)
  }

  function handleClear() {
    setValue('')
    onSearch('')
  }

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
        {loading ? (
          <svg
            className="h-5 w-5 animate-spin text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Buscar por nome ou código  (ex: colecistectomia, 0407010005)"
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
    </div>
  )
}
