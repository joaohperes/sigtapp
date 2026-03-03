import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCidSearch } from '../hooks/useCidSearch'

const SEXO_LABEL = { M: 'Masculino', F: 'Feminino', I: null, A: null } // I/A = Indiferente, não exibe badge
const EXEMPLOS = ['câncer de ovário', 'infarto', 'diabetes', 'derrame cerebral', 'pneumonia']

export function CidSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const { results, loading, error, meta, search } = useCidSearch()
  const [value, setValue] = useState(initialQuery)
  const debounceRef = useRef(null)

  useEffect(() => {
    document.title = 'Busca de CID — SIGTAP'
    return () => { document.title = 'SIGTAP — Tabela de Procedimentos SUS' }
  }, [])

  useEffect(() => {
    if (initialQuery.trim().length >= 2) search(initialQuery)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e) {
    const v = e.target.value
    setValue(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (v.trim().length >= 2) {
        setSearchParams({ q: v.trim() })
        search(v)
      } else {
        setSearchParams({})
        search('')
      }
    }, 400)
  }

  function handleExemplo(term) {
    setValue(term)
    setSearchParams({ q: term })
    search(term)
  }

  const searched = value.trim().length >= 2

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-600">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 text-center">
          <Link to="/" className="text-xs font-semibold uppercase tracking-widest text-indigo-300 hover:text-white transition">
            ← SIGTAP
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Busca de CID-10</h1>
          <p className="mt-1.5 text-sm text-indigo-200">
            Encontre códigos usando linguagem comum — "câncer", "infarto", "derrame"
          </p>

          {/* Search */}
          <div className="relative mt-8">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              {loading ? (
                <svg className="h-5 w-5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
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
              value={value}
              onChange={handleChange}
              autoFocus
              placeholder="Ex: câncer de ovário, infarto, pressão alta..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4
                         text-sm shadow-sm placeholder:text-gray-400
                         focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {!searched && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXEMPLOS.map((term) => (
                <button
                  key={term}
                  onClick={() => handleExemplo(term)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-indigo-100 hover:bg-white/20 transition"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Banner de expansão de sinônimo */}
        {meta?.substituicoes?.length > 0 && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-amber-800">
              Busquei por{' '}
              {meta.substituicoes.map((s, i) => (
                <span key={i}>
                  {i > 0 && ' e '}
                  <span className="font-medium">"{s.para}"</span>
                  <span className="text-amber-600"> (de "{s.de}")</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Erro ao buscar: {error}
          </div>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {results.length} código{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {results.map((cid) => (
                <CidRow key={cid.co_cid} cid={cid} />
              ))}
            </div>
          </>
        )}

        {/* Sem resultados */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-slate-600">Nenhum CID encontrado</p>
            <p className="mt-1 text-xs text-slate-400">Tente outros termos ou o código diretamente (ex: C56)</p>
          </div>
        )}

        {/* Estado inicial */}
        {!searched && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Busque pelo nome da doença</p>
            <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
              Use termos comuns como "câncer", "infarto" ou "derrame" —
              o sistema encontra o CID correto automaticamente.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function CidRow({ cid }) {
  const sexo = SEXO_LABEL[cid.tp_sexo]
  const isCidCategory = cid.co_cid.trim().length === 3 // ex: "C56" vs "C560"

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
      {/* Código */}
      <div className="w-14 shrink-0">
        <span className={`font-mono text-sm font-semibold ${isCidCategory ? 'text-indigo-700' : 'text-slate-700'}`}>
          {cid.co_cid.trim()}
        </span>
      </div>

      {/* Nome */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">{cid.no_cid?.trim()}</p>
        {sexo && (
          <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {sexo}
          </span>
        )}
      </div>

      {/* Ação */}
      <div className="shrink-0">
        <Link
          to={`/?q=${encodeURIComponent(cid.co_cid.trim())}`}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs
                     font-medium text-indigo-700 transition hover:bg-indigo-100 whitespace-nowrap"
        >
          Ver →
        </Link>
      </div>
    </div>
  )
}
