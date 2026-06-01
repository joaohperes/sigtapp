import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useCidSearch } from '../hooks/useCidSearch'
import { useTheme } from '../contexts/ThemeContext'
import { useModoUE } from '../contexts/ModoUEContext'
import { ContextoClinico } from '../components/ContextoClinico'
import { CORINGAS_GRUPOS } from '../data/coringas'
import { cn } from '@/lib/utils'

const COR_MAP = {
  red:    { dot: 'bg-red-400',    label: 'text-red-400',    chip: 'border-red-400/20 text-red-300 hover:border-red-400/60 hover:bg-red-400/10',    header: 'bg-red-400/10'    },
  orange: { dot: 'bg-orange-400', label: 'text-orange-400', chip: 'border-orange-400/20 text-orange-300 hover:border-orange-400/60 hover:bg-orange-400/10', header: 'bg-orange-400/10' },
  blue:   { dot: 'bg-blue-400',   label: 'text-blue-400',   chip: 'border-blue-400/20 text-blue-300 hover:border-blue-400/60 hover:bg-blue-400/10',   header: 'bg-blue-400/10'   },
  purple: { dot: 'bg-purple-400', label: 'text-purple-400', chip: 'border-purple-400/20 text-purple-300 hover:border-purple-400/60 hover:bg-purple-400/10', header: 'bg-purple-400/10' },
  yellow: { dot: 'bg-yellow-400', label: 'text-yellow-400', chip: 'border-yellow-400/20 text-yellow-300 hover:border-yellow-400/60 hover:bg-yellow-400/10', header: 'bg-yellow-400/10' },
  green:  { dot: 'bg-green-400',  label: 'text-green-400',  chip: 'border-green-400/20 text-green-300 hover:border-green-400/60 hover:bg-green-400/10',  header: 'bg-green-400/10'  },
  teal:   { dot: 'bg-teal-400',   label: 'text-teal-400',   chip: 'border-teal-400/20 text-teal-300 hover:border-teal-400/60 hover:bg-teal-400/10',   header: 'bg-teal-400/10'   },
  stone:  { dot: 'bg-stone-400',  label: 'text-stone-300',  chip: 'border-stone-400/20 text-stone-300 hover:border-stone-400/60 hover:bg-stone-400/10',  header: 'bg-stone-400/10'  },
  indigo: { dot: 'bg-indigo-400', label: 'text-indigo-400', chip: 'border-indigo-400/20 text-indigo-300 hover:border-indigo-400/60 hover:bg-indigo-400/10', header: 'bg-indigo-400/10' },
  pink:   { dot: 'bg-pink-400',   label: 'text-pink-400',   chip: 'border-pink-400/20 text-pink-300 hover:border-pink-400/60 hover:bg-pink-400/10',   header: 'bg-pink-400/10'   },
}

// Light mode equivalents
const COR_MAP_LIGHT = {
  red:    { dot: 'bg-red-400',    label: 'text-red-600',    chip: 'border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50',    header: 'bg-red-50'    },
  orange: { dot: 'bg-orange-400', label: 'text-orange-600', chip: 'border-orange-200 text-orange-700 hover:border-orange-400 hover:bg-orange-50', header: 'bg-orange-50' },
  blue:   { dot: 'bg-blue-400',   label: 'text-blue-600',   chip: 'border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-blue-50',   header: 'bg-blue-50'   },
  purple: { dot: 'bg-purple-400', label: 'text-purple-600', chip: 'border-purple-200 text-purple-700 hover:border-purple-400 hover:bg-purple-50', header: 'bg-purple-50' },
  yellow: { dot: 'bg-yellow-400', label: 'text-yellow-700', chip: 'border-yellow-200 text-yellow-800 hover:border-yellow-400 hover:bg-yellow-50', header: 'bg-yellow-50' },
  green:  { dot: 'bg-green-400',  label: 'text-green-600',  chip: 'border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50',  header: 'bg-green-50'  },
  teal:   { dot: 'bg-teal-400',   label: 'text-teal-600',   chip: 'border-teal-200 text-teal-700 hover:border-teal-400 hover:bg-teal-50',   header: 'bg-teal-50'   },
  stone:  { dot: 'bg-stone-400',  label: 'text-stone-600',  chip: 'border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50',  header: 'bg-stone-50'  },
  indigo: { dot: 'bg-indigo-400', label: 'text-indigo-600', chip: 'border-indigo-200 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50', header: 'bg-indigo-50' },
  pink:   { dot: 'bg-pink-400',   label: 'text-pink-600',   chip: 'border-pink-200 text-pink-700 hover:border-pink-400 hover:bg-pink-50',   header: 'bg-pink-50'   },
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

const CHIPS_PREVIEW = 4

function Chip({ c, cor, dark }) {
  return (
    <Link
      to={`/?q=${encodeURIComponent(c.co_cid)}&ctx=1`}
      title={c.co_cid}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
        cor.chip
      )}
    >
      <span className="font-mono text-[9px] opacity-50 shrink-0 tabular-nums">{c.co_cid}</span>
      <span className={cn('h-2.5 w-px shrink-0 opacity-25', dark ? 'bg-white' : 'bg-current')} />
      {c.label}
    </Link>
  )
}

function GrupoCard({ grupo, dark }) {
  const [extraAberto, setExtraAberto] = useState(false)
  const corMap = dark ? COR_MAP : COR_MAP_LIGHT
  const cor = corMap[grupo.cor] || corMap.blue
  const temExtra = grupo.extra?.length > 0

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      dark ? 'border-[rgba(255,255,255,0.07)] bg-[#0d1424]' : 'border-border bg-card'
    )}>
      {/* Header */}
      <div className={cn('flex items-center gap-2 px-3 py-2', cor.header)}>
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cor.dot)} />
        <span className={cn('text-[11px] font-bold tracking-wide flex-1', cor.label)}>{grupo.label}</span>
        <span className="text-[10px] text-muted-foreground/50 tabular-nums">{grupo.cids.length}</span>
      </div>

      {/* Chips principais */}
      <div className="px-2.5 pt-2 pb-1.5 flex flex-wrap gap-1.5">
        {grupo.cids.map(c => <Chip key={c.co_cid} c={c} cor={cor} dark={dark} />)}
      </div>

      {/* Extras colapsáveis */}
      {temExtra && (
        <div className={cn('border-t', dark ? 'border-[rgba(255,255,255,0.05)]' : 'border-border/40')}>
          {extraAberto && (
            <div className="px-2.5 pt-1.5 pb-1 flex flex-wrap gap-1.5">
              {grupo.extra.map(c => <Chip key={c.co_cid} c={c} cor={cor} dark={dark} />)}
            </div>
          )}
          <button
            onClick={() => setExtraAberto(v => !v)}
            className={cn(
              'w-full px-3 py-1 text-[10px] font-medium transition flex items-center gap-1',
              dark ? 'text-muted-foreground/50 hover:text-muted-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'
            )}
          >
            <svg className={cn('h-3 w-3 transition-transform', extraAberto ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {extraAberto ? 'ver menos' : `+${grupo.extra.length} diagnósticos`}
          </button>
        </div>
      )}
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

  useEffect(() => {
    document.title = 'SIGTAPP — Diagnóstico e Regulação SUS'
  }, [])

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      setValue(initialQuery)
      search(initialQuery)
    } else {
      setValue('')
      search('')
    }
  }, [initialQuery]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const searched = value.trim().length >= 2

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className={cn(
        'relative overflow-hidden',
        modoUE
          ? 'bg-gradient-to-br from-red-950 via-red-900 to-red-800'
          : 'bg-[#080F1E]'
      )}>
        {!modoUE && (
          <div className="pointer-events-none absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
        )}
        {!modoUE && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72" style={{
            background: 'radial-gradient(ellipse 80% 100% at 50% -5%, rgba(99,102,241,0.18) 0%, transparent 70%)',
          }} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.18))' }} />

        <div className="relative mx-auto max-w-3xl px-4 py-4">
          {/* Campo de busca */}
          <div className="relative">
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
              placeholder="pneumonia, infarto, AVC, sepse, fratura..."
              className="w-full rounded-xl border-0 bg-white/10 text-white py-4 pl-12 pr-12 text-base shadow-lg placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
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

      <main className="mx-auto max-w-6xl px-4 py-8">
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

        {/* Resultados de busca */}
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

        {/* Mapa de diagnósticos — estado inicial */}
        {!searched && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Diagnósticos frequentes</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Clique em qualquer diagnóstico para ver CID, procedimentos e regulação</p>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {CORINGAS_GRUPOS.map(grupo => (
                <GrupoCard key={grupo.id} grupo={grupo} dark={dark} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
