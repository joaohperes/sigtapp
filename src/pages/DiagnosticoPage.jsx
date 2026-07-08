import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useCidSearch } from '../hooks/useCidSearch'
import { useModoUE } from '../contexts/ModoUEContext'
import { ContextoClinico } from '../components/ContextoClinico'
import { CORINGAS_GRUPOS, CORINGAS_CID } from '../data/coringas'
import { agruparPorRelevancia, pillsDeSistema, cidTocaSistema } from '../lib/relevanciaCid'
import { track } from '@vercel/analytics'
import { cn } from '@/lib/utils'

// Set dos CIDs curados do app — usados como sinal forte de "comum" no agrupamento.
const CORINGAS_SET = new Set(CORINGAS_CID.map(c => c.co_cid.trim()))

// Mapa único de cores — classes light por padrão + variantes dark: (Tailwind resolve pelo <html class="dark">).
const COR_MAP = {
  red:    { dot: 'bg-red-400',    label: 'text-red-600 dark:text-red-400',       chip: 'border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:border-red-400/60 dark:hover:bg-red-400/10',    header: 'bg-red-50 dark:bg-red-400/10'    },
  orange: { dot: 'bg-orange-400', label: 'text-orange-600 dark:text-orange-400', chip: 'border-orange-200 text-orange-700 hover:border-orange-400 hover:bg-orange-50 dark:border-orange-400/20 dark:text-orange-300 dark:hover:border-orange-400/60 dark:hover:bg-orange-400/10', header: 'bg-orange-50 dark:bg-orange-400/10' },
  blue:   { dot: 'bg-blue-400',   label: 'text-blue-600 dark:text-blue-400',     chip: 'border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-400/20 dark:text-blue-300 dark:hover:border-blue-400/60 dark:hover:bg-blue-400/10',   header: 'bg-blue-50 dark:bg-blue-400/10'   },
  purple: { dot: 'bg-purple-400', label: 'text-purple-600 dark:text-purple-400', chip: 'border-purple-200 text-purple-700 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-400/20 dark:text-purple-300 dark:hover:border-purple-400/60 dark:hover:bg-purple-400/10', header: 'bg-purple-50 dark:bg-purple-400/10' },
  yellow: { dot: 'bg-yellow-400', label: 'text-yellow-700 dark:text-yellow-400', chip: 'border-yellow-200 text-yellow-800 hover:border-yellow-400 hover:bg-yellow-50 dark:border-yellow-400/20 dark:text-yellow-300 dark:hover:border-yellow-400/60 dark:hover:bg-yellow-400/10', header: 'bg-yellow-50 dark:bg-yellow-400/10' },
  green:  { dot: 'bg-green-400',  label: 'text-green-600 dark:text-green-400',   chip: 'border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50 dark:border-green-400/20 dark:text-green-300 dark:hover:border-green-400/60 dark:hover:bg-green-400/10',  header: 'bg-green-50 dark:bg-green-400/10'  },
  teal:   { dot: 'bg-teal-400',   label: 'text-teal-600 dark:text-teal-400',     chip: 'border-teal-200 text-teal-700 hover:border-teal-400 hover:bg-teal-50 dark:border-teal-400/20 dark:text-teal-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10',   header: 'bg-teal-50 dark:bg-teal-400/10'   },
  stone:  { dot: 'bg-stone-400',  label: 'text-stone-600 dark:text-stone-300',   chip: 'border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-400/20 dark:text-stone-300 dark:hover:border-stone-400/60 dark:hover:bg-stone-400/10',  header: 'bg-stone-50 dark:bg-stone-400/10'  },
  indigo: { dot: 'bg-indigo-400', label: 'text-indigo-600 dark:text-indigo-400', chip: 'border-indigo-200 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-400/20 dark:text-indigo-300 dark:hover:border-indigo-400/60 dark:hover:bg-indigo-400/10', header: 'bg-indigo-50 dark:bg-indigo-400/10' },
  pink:   { dot: 'bg-pink-400',   label: 'text-pink-600 dark:text-pink-400',     chip: 'border-pink-200 text-pink-700 hover:border-pink-400 hover:bg-pink-50 dark:border-pink-400/20 dark:text-pink-300 dark:hover:border-pink-400/60 dark:hover:bg-pink-400/10',   header: 'bg-pink-50 dark:bg-pink-400/10'   },
}

function CidRow({ cid, expandirAuto }) {
  const sexo = { M: 'Masculino', F: 'Feminino', I: null, A: null }[cid.tp_sexo]

  return (
    <div className="border-b border-border last:border-0 px-4 py-3.5">
      <div className="mb-2">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="font-mono text-sm font-bold shrink-0 text-foreground">
            {cid.co_cid.trim()}
          </span>
          <span className="text-sm text-muted-foreground leading-snug">
            {cid.no_cid?.trim()}
          </span>
        </div>
        {sexo && (
          <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {sexo}
          </span>
        )}
      </div>
      {/* Gesto único: o botão dentro do ContextoClinico abre a regulação inline.
          O link p/ a página de faturamento cheia vive lá dentro, quando aberto. */}
      <ContextoClinico cid={cid} collapsible={!expandirAuto} />
    </div>
  )
}

const CHIPS_PREVIEW = 4

function Chip({ c, cor }) {
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
      <span className="h-2.5 w-px shrink-0 opacity-25 bg-current dark:bg-white" />
      {c.label}
    </Link>
  )
}

function GrupoCard({ grupo }) {
  const [extraAberto, setExtraAberto] = useState(false)
  const cor = COR_MAP[grupo.cor] || COR_MAP.blue
  const temExtra = grupo.extra?.length > 0

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      'border-border bg-card'
    )}>
      {/* Header */}
      <div className={cn('flex items-center gap-2 px-3 py-2', cor.header)}>
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cor.dot)} />
        <span className={cn('text-[11px] font-bold tracking-wide flex-1', cor.label)}>{grupo.label}</span>
        <span className="text-[10px] text-muted-foreground/50 tabular-nums">{grupo.cids.length}</span>
      </div>

      {/* Chips principais */}
      <div className="px-2.5 pt-2 pb-1.5 flex flex-wrap gap-1.5">
        {grupo.cids.map((c, i) =>
          c.break
            ? <div key={`br-${i}`} className="w-full" />
            : <Chip key={c.co_cid} c={c} cor={cor} />
        )}
      </div>

      {/* Extras colapsáveis */}
      {temExtra && (
        <div className="border-t border-border/40 dark:border-white/5">
          {extraAberto && (
            <div className="px-2.5 pt-1.5 pb-1 flex flex-wrap gap-1.5">
              {grupo.extra.map(c => <Chip key={c.co_cid} c={c} cor={cor} />)}
            </div>
          )}
          <button
            onClick={() => setExtraAberto(v => !v)}
            className={cn(
              'w-full px-3 py-1 text-[10px] font-medium transition flex items-center gap-1',
              'text-muted-foreground/60 hover:text-muted-foreground dark:text-muted-foreground/50'
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
  const { modoUE } = useModoUE()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const autoCtx = searchParams.get('ctx') === '1'

  const { results, loading, error, meta, sugestoes, search } = useCidSearch()
  const [value, setValue] = useState(initialQuery)
  const [mostrarVariantes, setMostrarVariantes] = useState(false)
  const [filtroSistema, setFiltroSistema] = useState(null)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  // Reseta "ver variantes" e filtro de sistema a cada nova busca
  useEffect(() => { setMostrarVariantes(false); setFiltroSistema(null) }, [results])

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
        track('busca_diagnostico', { termo: v.trim().slice(0, 60) })
      } else {
        setSearchParams({})
        search('')
      }
    }, 400)
  }

  const searched = value.trim().length >= 2

  return (
    <div className="min-h-screen bg-background">
      {/* Busca — tamanho fixo; só o entorno (título) muda, com fade suave */}
      <div className="border-b border-border bg-background">
        <div className={cn('mx-auto max-w-3xl px-4 transition-all duration-300', searched ? 'py-3' : 'pt-8 pb-6')}>
          {/* Título com fade — não empurra o input bruscamente */}
          <div
            className={cn(
              'overflow-hidden text-center transition-all duration-300',
              searched ? 'max-h-0 opacity-0 mb-0' : 'max-h-20 opacity-100 mb-4'
            )}
          >
            <h1 className="text-lg font-semibold text-foreground">Comece pelo diagnóstico</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Busque para ver CID, procedimentos SIGTAP e códigos de regulação
            </p>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              {loading
                ? <svg className="h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                : <svg className="h-4 w-4 text-muted-foreground/50" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>
              }
            </div>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              autoFocus
              placeholder="Buscar diagnóstico — pneumonia, infarto, AVC, sepse..."
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-9 text-[15px] text-foreground placeholder:text-muted-foreground/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
            {value && (
              <button
                onClick={() => { setValue(''); setSearchParams({}); search(''); inputRef.current?.focus() }}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground/50 hover:text-muted-foreground transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className={cn('mx-auto max-w-6xl px-4 pb-8', searched ? 'pt-8' : 'pt-6')}>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Erro: {error}
          </div>
        )}

        {/* Resultados de busca */}
        {searched && results.length > 0 && (() => {
          // Pills de filtro por sistema — só quando a busca é ampla o bastante
          // pra valer (>12) e há mais de um sistema representado.
          const pills = pillsDeSistema(results)
          const mostrarPills = results.length > 12 && pills.length > 1

          // Aplica o filtro de sistema ativo (se houver). cidTocaSistema inclui
          // sistemas secundários — clicar "Neuro" acha o aneurisma ambíguo (I72)
          // que é primariamente vascular mas pode ser cerebral.
          const resultsFiltrados = filtroSistema
            ? results.filter((cid) => cidTocaSistema(cid, filtroSistema))
            : results

          // Auto-expande o contexto só quando há poucos resultados (busca específica).
          const expandirAuto = resultsFiltrados.length <= 3

          // Separa diagnósticos que o plantonista codifica (comuns) do ruído
          // (variantes por agente, causa externa, perinatal...). Só agrupa quando
          // a lista é grande o bastante pra valer — buscas curtas ficam inteiras.
          const { comuns, variantes } = agruparPorRelevancia(resultsFiltrados, CORINGAS_SET)
          // Só agrupa quando vale a pena: lista grande, ruído proporcionalmente
          // relevante (≥40%), E sobram comuns suficientes pra não ficar "careca"
          // (≥3). Em buscas homogêneas (ex: "hsa" = 14 HSAs, 1 comum + 13 variantes),
          // não agrupa — mostra tudo junto, pois as "variantes" são legítimas.
          const agrupar =
            resultsFiltrados.length > 12 &&
            comuns.length >= 3 &&
            variantes.length / resultsFiltrados.length >= 0.4

          return (
            <div className="mb-6">
              <p className="mb-3 text-sm text-muted-foreground">
                {results.length} código{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                {filtroSistema && <span className="text-muted-foreground/60"> · filtrado: {pills.find(p => p.id === filtroSistema)?.label}</span>}
                {!filtroSistema && agrupar && (
                  <span className="text-muted-foreground/60"> · {comuns.length} mais usado{comuns.length !== 1 ? 's' : ''} no PS</span>
                )}
              </p>

              {/* Pills de sistema */}
              {mostrarPills && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFiltroSistema(null)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition',
                      !filtroSistema
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                    )}
                  >
                    Todos <span className="tabular-nums opacity-60">{results.length}</span>
                  </button>
                  {pills.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFiltroSistema(filtroSistema === p.id ? null : p.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition',
                        filtroSistema === p.id
                          ? 'border-primary/40 bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                      )}
                    >
                      {p.label} <span className="tabular-nums opacity-60">{p.reach}</span>
                    </button>
                  ))}
                </div>
              )}

              {agrupar ? (
                <>
                  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    {comuns.map((cid) => (
                      <CidRow key={cid.co_cid} cid={cid} expandirAuto={expandirAuto} />
                    ))}
                  </div>

                  {!mostrarVariantes ? (
                    <button
                      onClick={() => setMostrarVariantes(true)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      Ver {variantes.length} variante{variantes.length !== 1 ? 's' : ''} específica{variantes.length !== 1 ? 's' : ''}
                      <span className="text-muted-foreground/50">(por agente, perinatal, causa externa)</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setMostrarVariantes(false)}
                        className="mt-3 mb-2 flex w-full items-center gap-2 text-left transition group"
                      >
                        <svg className="h-3.5 w-3.5 rotate-180 text-muted-foreground/60 group-hover:text-muted-foreground transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 group-hover:text-muted-foreground transition">
                          Variantes específicas · recolher
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </button>
                      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm opacity-80">
                        {variantes.map((cid) => (
                          <CidRow key={cid.co_cid} cid={cid} expandirAuto={false} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  {resultsFiltrados.map((cid) => (
                    <CidRow key={cid.co_cid} cid={cid} expandirAuto={expandirAuto} />
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {searched && !loading && results.length === 0 && !error && (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {sugestoes.length > 0
                ? <>O código <span className="font-mono font-bold text-foreground">{value.trim().replace('.', '').toUpperCase()}</span> não existe na CID-10</>
                : 'Nenhum CID encontrado'}
            </p>
            {sugestoes.length > 0 ? (
              <>
                <p className="mt-1 text-xs text-muted-foreground/70">Códigos próximos nesta faixa — talvez algum seja o que você procura:</p>
                <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">
                  {sugestoes.map((c) => (
                    <button
                      key={c.co_cid}
                      onClick={() => { setValue(c.co_cid); setSearchParams({ q: c.co_cid }); search(c.co_cid) }}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs transition hover:border-foreground/30 hover:bg-secondary"
                    >
                      <span className="font-mono font-bold shrink-0 text-foreground">{c.co_cid}</span>
                      <span className="truncate text-muted-foreground">{c.no_cid?.trim()}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground/70">Tente outros termos ou o código diretamente (ex: C56)</p>
            )}
          </div>
        )}

        {/* Mapa de diagnósticos — estado inicial */}
        {!searched && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                ou explore por sistema
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {CORINGAS_GRUPOS.map(grupo => (
                <GrupoCard key={grupo.id} grupo={grupo} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
