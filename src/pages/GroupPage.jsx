import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGrupoProcedimentos } from '../hooks/useGrupos'
import { GRUPO_MAP } from '../data/grupos'
import { ProcedureCard, ProcedureCardSkeleton } from '../components/ProcedureCard'
import { ProcedureTable } from '../components/ProcedureTable'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo, toSentenceCase } from '../utils/formatters'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const VIEW_MODES = ['cards', 'tabela']
const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'nome_az', label: 'Nome A→Z' },
  { value: 'nome_za', label: 'Nome Z→A' },
  { value: 'maior_valor', label: 'Maior valor' },
  { value: 'menor_valor', label: 'Menor valor' },
]
const PAGE_SIZE = 30

function totalOf(p) {
  return (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
}

function applySort(arr, key) {
  if (key === 'nome_az') return [...arr].sort((a, b) => a.no_procedimento.localeCompare(b.no_procedimento, 'pt-BR'))
  if (key === 'nome_za') return [...arr].sort((a, b) => b.no_procedimento.localeCompare(a.no_procedimento, 'pt-BR'))
  if (key === 'maior_valor') return [...arr].sort((a, b) => totalOf(b) - totalOf(a))
  if (key === 'menor_valor') return [...arr].sort((a, b) => totalOf(a) - totalOf(b))
  return arr
}

function ProcedureSheetContent({ procedure }) {
  const { co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, no_financiamento } = procedure
  const total = (vl_sa || 0) + (vl_sh || 0) + (vl_sp || 0)
  const estilo = GRUPO_MAP[co_procedimento?.slice(0, 2)]

  const [descricao, setDescricao] = useState(null)
  const [descLoading, setDescLoading] = useState(true)

  useEffect(() => {
    setDescricao(null)
    setDescLoading(true)
    supabase
      .from('procedimentos')
      .select('ds_procedimento')
      .eq('co_procedimento', co_procedimento)
      .single()
      .then(({ data }) => {
        setDescricao(data?.ds_procedimento || null)
        setDescLoading(false)
      })
  }, [co_procedimento])

  return (
    <div className="flex flex-col gap-5 pt-2">
      <SheetHeader>
        <div className="flex items-start gap-3">
          {estilo && (
            <div className={cn('mt-1 h-10 w-1.5 shrink-0 rounded-full', estilo.dot)} />
          )}
          <div>
            <p className="font-mono text-xs text-slate-400">{formatCodigo(co_procedimento)}</p>
            <SheetTitle className="mt-1 text-left text-base font-semibold leading-snug text-slate-800">
              {no_procedimento}
            </SheetTitle>
            {no_financiamento && (
              <Badge variant="secondary" className="mt-2 rounded-full px-2 py-0.5 text-xs font-normal">
                {no_financiamento}
              </Badge>
            )}
          </div>
        </div>
      </SheetHeader>

      {estilo && (
        <div className={cn('rounded-lg px-3 py-2 text-xs font-medium', estilo.bg, estilo.text)}>
          {estilo.no}
        </div>
      )}

      {(descLoading || descricao) && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">Descrição</p>
          {descLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/6" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-slate-600">{toSentenceCase(descricao)}</p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-medium text-slate-400">Valores SUS</p>
        <div className="space-y-2">
          {[
            { label: 'Ambulatorial (SA)', value: vl_sa },
            { label: 'Hospitalar (SH)', value: vl_sh },
            { label: 'Profissional (SP)', value: vl_sp },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="tabular-nums text-sm text-slate-700">{formatBRL(value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="tabular-nums text-base font-bold text-emerald-600">{formatBRL(total)}</span>
          </div>
        </div>
      </div>

      <Link
        to={`/procedimento/${co_procedimento}`}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5
                   text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Ver página completa
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

export function GroupPage() {
  const { co } = useParams()
  const [subgrupoAtivo, setSubgrupoAtivo] = useState(null)
  const [view, setView] = useState('cards')
  const [filtroTexto, setFiltroTexto] = useState('')

  // Filtros avançados
  const [showFilters, setShowFilters] = useState(false)
  const [filtroFinanciamento, setFiltroFinanciamento] = useState(null)
  const [valorMin, setValorMin] = useState('')
  const [valorMax, setValorMax] = useState('')

  // Ordenação
  const [sortKey, setSortKey] = useState('relevancia')

  // Paginação client-side
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Sheet
  const [sheetProc, setSheetProc] = useState(null)

  const grupo = GRUPO_MAP[co]
  const { procedimentos, subgrupos, loading } = useGrupoProcedimentos(co, subgrupoAtivo)

  useEffect(() => {
    if (grupo) {
      document.title = `${grupo.no} — SIGTAP`
      return () => { document.title = 'SIGTAP — Tabela de Procedimentos SUS' }
    }
  }, [grupo])

  const financiamentosPresentes = [...new Map(
    procedimentos
      .filter(p => p.tp_financiamento)
      .map(p => [p.tp_financiamento, { tp: p.tp_financiamento, no: p.no_financiamento }])
  ).values()].sort((a, b) => a.tp.localeCompare(b.tp))

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [procedimentos, filtroTexto, filtroFinanciamento, valorMin, valorMax, sortKey])

  function resetFilters() {
    setFiltroFinanciamento(null)
    setValorMin('')
    setValorMax('')
  }

  const filtrosAtivos = [filtroFinanciamento, valorMin, valorMax].filter(Boolean).length

  const filteredResults = procedimentos.filter(p => {
    if (filtroTexto.trim().length >= 2 && !p.no_procedimento.toLowerCase().includes(filtroTexto.toLowerCase())) return false
    if (filtroFinanciamento && p.tp_financiamento !== filtroFinanciamento) return false
    const total = totalOf(p)
    if (valorMin !== '' && total < parseFloat(valorMin)) return false
    if (valorMax !== '' && total > parseFloat(valorMax)) return false
    return true
  })

  const sortedResults = applySort(filteredResults, sortKey)
  const visibleResults = sortedResults.slice(0, visibleCount)
  const hasMore = sortedResults.length > visibleCount
  const totalSubgrupos = subgrupos.reduce((s, g) => s + Number(g.qt_procedimentos), 0)

  if (!grupo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">Grupo não encontrado.</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">← Voltar</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Link to="/" className="text-sm text-blue-300 hover:text-white transition">
            ← Todos os grupos
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${grupo.bg} ${grupo.text}`}>
              Grupo {grupo.co}
            </span>
            <h1 className="text-xl font-semibold text-white">{grupo.no}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex gap-6">

          {/* Sidebar — subgrupos */}
          {subgrupos.length > 0 && (
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subgrupos</p>
                </div>
                <div className="divide-y divide-slate-50 max-h-[80vh] overflow-y-auto">
                  <button
                    onClick={() => setSubgrupoAtivo(null)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition ${
                      !subgrupoAtivo
                        ? `${grupo.bg} ${grupo.text} font-medium`
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs leading-snug">Todos</span>
                    <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {totalSubgrupos.toLocaleString('pt-BR')}
                    </span>
                  </button>
                  {subgrupos.map((s) => (
                    <button
                      key={s.co_subgrupo}
                      onClick={() => setSubgrupoAtivo(s.co_subgrupo)}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition ${
                        subgrupoAtivo === s.co_subgrupo
                          ? `${grupo.bg} ${grupo.text} font-medium`
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs leading-snug">{s.no_subgrupo}</span>
                      <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        {Number(s.qt_procedimentos).toLocaleString('pt-BR')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            {/* Busca + controles */}
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="relative w-full sm:flex-1">
                <svg className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400"
                  viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="Filtrar por nome neste grupo..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm
                             placeholder:text-slate-400 focus:border-blue-500 focus:outline-none
                             focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Sort */}
              <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger className="h-10 w-36 rounded-xl text-xs text-slate-600 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter toggle */}
              {financiamentosPresentes.length > 0 && (
                <button
                  onClick={() => setShowFilters(s => !s)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                    showFilters || filtrosAtivos > 0
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filtros
                  {filtrosAtivos > 0 && (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                      {filtrosAtivos}
                    </span>
                  )}
                </button>
              )}

              {/* View toggle */}
              <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
                {VIEW_MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setView(m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                      view === m
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                {financiamentosPresentes.length > 1 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Financiamento</p>
                    <div className="flex flex-wrap gap-2">
                      {financiamentosPresentes.map(({ tp, no }) => {
                        const active = filtroFinanciamento === tp
                        return (
                          <button
                            key={tp}
                            onClick={() => setFiltroFinanciamento(active ? null : tp)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              active
                                ? 'border-transparent bg-slate-700 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {no || tp}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Valor total SUS</p>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                      <input
                        type="number" min="0" value={valorMin}
                        onChange={e => setValorMin(e.target.value)}
                        placeholder="Mínimo"
                        className="w-36 rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-sm
                                   focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                      />
                    </div>
                    <span className="text-slate-400 text-sm">—</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                      <input
                        type="number" min="0" value={valorMax}
                        onChange={e => setValorMax(e.target.value)}
                        placeholder="Máximo"
                        className="w-36 rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-sm
                                   focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                      />
                    </div>
                  </div>
                </div>

                {filtrosAtivos > 0 && (
                  <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}

            {/* Resultado count */}
            {!loading && (
              <p className="mb-3 text-sm text-slate-500">
                {sortedResults.length}
                {filtrosAtivos > 0 && ` de ${procedimentos.length}`} procedimento{sortedResults.length !== 1 ? 's' : ''}
                {hasMore && <span className="text-slate-400"> · mostrando {visibleCount}</span>}
              </p>
            )}

            {/* Skeleton loading */}
            {loading && (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProcedureCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && visibleResults.length > 0 && (
              view === 'cards' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleResults.map((p) => (
                    <ProcedureCard key={p.co_procedimento} procedure={p} onSelect={setSheetProc} />
                  ))}
                </div>
              ) : (
                <ProcedureTable results={visibleResults} onSelect={setSheetProc} />
              )
            )}

            {hasMore && !loading && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium
                             text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                >
                  Carregar mais ({sortedResults.length - visibleCount} restantes)
                </button>
              </div>
            )}

            {!loading && sortedResults.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-sm font-medium text-slate-600">Nenhum procedimento encontrado</p>
                <p className="mt-1 text-xs text-slate-400">Tente outro subgrupo ou termo</p>
                {filtrosAtivos > 0 && (
                  <button onClick={resetFilters} className="mt-2 text-xs text-blue-600 hover:underline block mx-auto">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={!!sheetProc} onOpenChange={open => !open && setSheetProc(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {sheetProc && <ProcedureSheetContent procedure={sheetProc} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
