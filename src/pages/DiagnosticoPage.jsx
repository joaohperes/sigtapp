import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useCidSearch } from '../hooks/useCidSearch'
import { useTheme } from '../contexts/ThemeContext'
import { useModoUE } from '../contexts/ModoUEContext'
import { ContextoClinico } from '../components/ContextoClinico'
import { CORINGAS_GRUPOS } from '../data/coringas'
import { cn } from '@/lib/utils'

const COR_MAP = {
  red:    { dot: 'bg-red-400',    label: 'text-red-400',    chip: 'hover:border-red-400/40 hover:text-red-400'     },
  orange: { dot: 'bg-orange-400', label: 'text-orange-400', chip: 'hover:border-orange-400/40 hover:text-orange-400'},
  blue:   { dot: 'bg-blue-400',   label: 'text-blue-400',   chip: 'hover:border-blue-400/40 hover:text-blue-400'   },
  purple: { dot: 'bg-purple-400', label: 'text-purple-400', chip: 'hover:border-purple-400/40 hover:text-purple-400'},
  yellow: { dot: 'bg-yellow-400', label: 'text-yellow-400', chip: 'hover:border-yellow-400/40 hover:text-yellow-400'},
  green:  { dot: 'bg-green-400',  label: 'text-green-400',  chip: 'hover:border-green-400/40 hover:text-green-400' },
  teal:   { dot: 'bg-teal-400',   label: 'text-teal-400',   chip: 'hover:border-teal-400/40 hover:text-teal-400'   },
}

function CidRow({ cid, dark, autoCtx }) {
  const sexo = { M: 'Masculino', F: 'Feminino', I: null, A: null }[cid.tp_sexo]
  const isCat = cid.co_cid.trim().length === 3

  return (
    <div className="border-b border-border last:border-0 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-14 shrink-0">
          <span className={cn('font-mono text-sm font-semibold', isCat ? 'text-primary' : 'text-foreground')}>
            {cid.co_cid.trim()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">{cid.no_cid?.trim()}</p>
          {sexo && (
            <span className="mt-0.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {sexo}
            </span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Link
            to={`/procedimentos?q=${encodeURIComponent(cid.co_cid.trim())}&sc=1`}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-xs font-medium transition whitespace-nowrap',
              dark
                ? 'border-[rgba(255,255,255,0.1)] text-muted-foreground hover:border-[rgba(255,255,255,0.2)] hover:text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            Procedimentos →
          </Link>
        </div>
      </div>
      <ContextoClinico cid={cid} autoOpen={autoCtx} />
    </div>
  )
}

export function DiagnosticoPage() {
  const { dark } = useTheme()
  const { modoUE } = useModoUE()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const autoCtx = searchParams.get('ctx') === '1'

  const { results, loading, error, meta, search } = useCidSearch()
  const [value, setValue] = useState(initialQuery)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  // Grupos abertos por padrão: infeccioso e cardiovascular
  const [abertos, setAbertos] = useState(() => new Set(['infeccioso', 'cardiovascular']))

  useEffect(() => {
    document.title = 'SIGTAPP — Diagnóstico e Regulação SUS'
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

  function toggleGrupo(id) {
    setAbertos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const searched = value.trim().length >= 2

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Busca */}
      <div className={
        modoUE
          ? 'bg-gradient-to-br from-red-950 via-red-900 to-red-800'
          : dark
            ? 'bg-gradient-to-br from-[#0A1628] via-[#0D2347] to-[#0F3460]'
            : 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800'
      }>
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white font-display" style={{ letterSpacing: '0.08em' }}>
            SIGTAPP
          </h1>
          <p className="mt-1.5 text-sm text-blue-200/80">
            Busque pelo diagnóstico — encontre CID, procedimentos e códigos de regulação
          </p>

          {/* Campo de busca */}
          <div className="relative mt-6">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              {loading
                ? <svg className="h-5 w-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                : <svg className="h-5 w-5 text-white/40" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
              }
            </div>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              autoFocus
              placeholder="pneumonia, infarto, AVC, sepse, apendicite..."
              className="w-full rounded-xl border-0 bg-white/10 text-white py-4 pl-12 pr-12 text-base shadow-lg placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
            />
            {value && (
              <button
                onClick={() => { setValue(''); setSearchParams({}); search(''); inputRef.current?.focus() }}
                className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white/80 transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
              </button>
            )}
          </div>

          {/* Link para busca de procedimentos */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <button
              onClick={() => navigate('/procedimentos')}
              className="text-white/50 hover:text-white/80 transition underline-offset-2 hover:underline"
            >
              Buscar código de procedimento →
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Banner sinônimo */}
        {meta?.substituicoes?.length > 0 && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200/40 bg-amber-500/10 px-4 py-3 text-sm">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="text-foreground">
              Busquei por{' '}
              {meta.substituicoes.map((s, i) => (
                <span key={i}>{i > 0 && ' e '}<span className="font-medium">"{s.para}"</span><span className="text-muted-foreground"> (de "{s.de}")</span></span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Erro: {error}
          </div>
        )}

        {/* Resultados */}
        {searched && results.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-sm text-muted-foreground">
              {results.length} código{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              <span className="ml-2 text-muted-foreground/60">· clique em</span>
              <span className="ml-1 inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Contexto
              </span>
              <span className="ml-1 text-muted-foreground/60">para procedimentos e regulação</span>
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {results.map((cid, i) => (
                <CidRow key={cid.co_cid} cid={cid} dark={dark} autoCtx={autoCtx && i === 0} />
              ))}
            </div>
          </div>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">Nenhum CID encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Tente outros termos ou o código diretamente (ex: C56)</p>
          </div>
        )}

        {/* Coringas — estado inicial */}
        {!searched && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Diagnósticos frequentes do PS
              </h2>
              <span className="text-xs text-muted-foreground">clique para ver CID + procedimentos + regulação</span>
            </div>

            <div className="space-y-2">
              {CORINGAS_GRUPOS.map(grupo => {
                const cor = COR_MAP[grupo.cor] || COR_MAP.blue
                const aberto = abertos.has(grupo.id)
                return (
                  <div key={grupo.id} className={cn(
                    'rounded-xl border overflow-hidden',
                    dark ? 'border-[rgba(255,255,255,0.07)] bg-[#111827]' : 'border-border bg-card'
                  )}>
                    <button
                      onClick={() => toggleGrupo(grupo.id)}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
                    >
                      <span className={cn('h-2 w-2 rounded-full shrink-0', cor.dot)} />
                      <span className={cn('text-xs font-semibold flex-1', cor.label)}>{grupo.label}</span>
                      <span className="text-[10px] text-muted-foreground mr-1">{grupo.cids.length} diagnósticos</span>
                      <svg className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0', aberto ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {aberto && (
                      <div className={cn('px-4 pb-3 flex flex-wrap gap-1.5 border-t', dark ? 'border-[rgba(255,255,255,0.05)]' : 'border-border/50')}>
                        {grupo.cids.map(c => (
                          <Link
                            key={c.co_cid}
                            to={`/?q=${encodeURIComponent(c.co_cid)}&ctx=1`}
                            title={c.no_cid}
                            className={cn(
                              'mt-2 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                              dark
                                ? `border-[rgba(255,255,255,0.08)] bg-[#1a2236] text-[#e8edf5] ${cor.chip}`
                                : `border-border bg-background text-foreground ${cor.chip}`
                            )}
                          >
                            <span className="font-mono text-[10px] text-muted-foreground shrink-0">{c.co_cid}</span>
                            <span className={cn('h-3 w-px shrink-0', dark ? 'bg-white/10' : 'bg-border')} />
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
