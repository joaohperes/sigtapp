import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCidSearch } from '../hooks/useCidSearch'
import { useTheme } from '../contexts/ThemeContext'
import { ContextoClinico } from '../components/ContextoClinico'
import { cn } from '@/lib/utils'

const SEXO_LABEL = { M: 'Masculino', F: 'Feminino', I: null, A: null }
const EXEMPLOS = ['câncer de ovário', 'infarto', 'diabetes', 'derrame cerebral', 'pneumonia']

export function CidSearch() {
  const { dark } = useTheme()
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={dark ? "bg-gradient-to-br from-[#0A1628] via-[#0D2347] to-[#0F3460]" : "border-b border-border bg-card"}>
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 text-center">
          <Link to="/" className={cn("text-xs font-semibold uppercase tracking-widest transition", dark ? "text-indigo-300 hover:text-white" : "text-muted-foreground hover:text-foreground")}>
            ← SIGTAP
          </Link>
          <h1 className={cn("mt-3 text-3xl font-bold tracking-tight", dark ? "text-white" : "text-foreground")}>Busca de CID-10</h1>
          <p className={cn("mt-1.5 text-sm", dark ? "text-indigo-200" : "text-muted-foreground")}>
            Encontre códigos e veja procedimentos SIGTAP sugeridos por contexto clínico
          </p>

          <div className="relative mt-8">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              {loading ? (
                <svg className="h-5 w-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
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
              className={cn(
                "w-full rounded-xl border py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2",
                dark
                  ? "border-[rgba(255,255,255,0.1)] bg-[#1a2236] text-[#e8edf5] placeholder:text-[#8896a8] focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                  : "border-border bg-background text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:ring-primary/20"
              )}
            />
          </div>

          {!searched && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXEMPLOS.map((term) => (
                <button
                  key={term}
                  onClick={() => handleExemplo(term)}
                  className={cn("rounded-full px-3 py-1 text-xs transition", dark ? "bg-white/10 text-indigo-100 hover:bg-white/20" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {meta?.substituicoes?.length > 0 && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200/40 bg-amber-500/10 px-4 py-3 text-sm">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-foreground">
              Busquei por{' '}
              {meta.substituicoes.map((s, i) => (
                <span key={i}>
                  {i > 0 && ' e '}
                  <span className="font-medium">"{s.para}"</span>
                  <span className="text-muted-foreground"> (de "{s.de}")</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Erro ao buscar: {error}
          </div>
        )}

        {results.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {results.length} código{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              <span className="ml-2 text-muted-foreground/60">· clique em</span>
              <span className="ml-1 inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Contexto
              </span>
              <span className="ml-1 text-muted-foreground/60">para ver procedimentos sugeridos por IA</span>
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {results.map((cid) => (
                <CidRow key={cid.co_cid} cid={cid} dark={dark} />
              ))}
            </div>
          </>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">Nenhum CID encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Tente outros termos ou o código diretamente (ex: C56)</p>
          </div>
        )}

        {!searched && (
          <div className="py-16 text-center">
            <div className={cn("mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full", dark ? "bg-primary/10" : "bg-secondary")}>
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Busque pelo nome da doença</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Use termos comuns como "câncer", "infarto" ou "derrame" —
              o sistema encontra o CID e sugere procedimentos por contexto clínico.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function CidRow({ cid, dark }) {
  const sexo = SEXO_LABEL[cid.tp_sexo]
  const isCidCategory = cid.co_cid.trim().length === 3

  return (
    <div className="border-b border-border last:border-0 px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Código */}
        <div className="w-14 shrink-0">
          <span className={cn("font-mono text-sm font-semibold", isCidCategory ? "text-primary" : "text-foreground")}>
            {cid.co_cid.trim()}
          </span>
        </div>

        {/* Nome */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">{cid.no_cid?.trim()}</p>
          {sexo && (
            <span className="mt-0.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {sexo}
            </span>
          )}
        </div>

        {/* Ações */}
        <div className="shrink-0 flex items-center gap-2">
          <Link
            to={`/?q=${encodeURIComponent(cid.co_cid.trim())}`}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition whitespace-nowrap",
              dark
                ? "border-[rgba(255,255,255,0.1)] text-muted-foreground hover:border-[rgba(255,255,255,0.2)] hover:text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Procedimentos →
          </Link>
        </div>
      </div>

      {/* Contexto clínico — botão + painel colapsável */}
      <ContextoClinico cid={cid} />
    </div>
  )
}
