import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { ProcedureCard, ProcedureCardSkeleton } from '../components/ProcedureCard'
import { ProcedureTable } from '../components/ProcedureTable'
import { ProcedureSheetContent } from '../components/ProcedureSheetContent'
import { useProcedures } from '../hooks/useProcedures'
import { useGrupos } from '../hooks/useGrupos'
import { useFavoritos } from '../contexts/FavoritosContext'
import { useModoUE } from '../contexts/ModoUEContext'
import { GRUPO_MAP } from '../data/grupos'
import { supabase } from '../lib/supabase'
import { expandirSinonimos } from '../data/sinonimos'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const VIEW_MODES = ['cards', 'tabela']
const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'nome_az',    label: 'Nome A→Z' },
  { value: 'nome_za',    label: 'Nome Z→A' },
  { value: 'maior_valor', label: 'Maior valor' },
  { value: 'menor_valor', label: 'Menor valor' },
]
const PAGE_SIZE = 30
const RECENT_KEY = 'sigtap-recent'
const SEARCH_MODES = [
  { mode: null,      label: 'Tudo' },
  { mode: 'cid',     label: 'CID-10' },
  { mode: 'codigo',  label: 'Código' },
]

function totalOf(p) {
  return (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
}

function relevancePriority(p) {
  const nome = p.no_procedimento?.toUpperCase() || ''
  const grupo = p.co_procedimento?.slice(0, 2) || ''
  if (nome.startsWith('TRATAMENTO')) return 0
  if (grupo === '03') return 1  // procedimentos clínicos
  if (grupo === '04') return 2  // procedimentos cirúrgicos
  return 3
}

function applySort(arr, key) {
  if (key === 'nome_az')    return [...arr].sort((a, b) => a.no_procedimento.localeCompare(b.no_procedimento, 'pt-BR'))
  if (key === 'nome_za')    return [...arr].sort((a, b) => b.no_procedimento.localeCompare(a.no_procedimento, 'pt-BR'))
  if (key === 'maior_valor') return [...arr].sort((a, b) => totalOf(b) - totalOf(a))
  if (key === 'menor_valor') return [...arr].sort((a, b) => totalOf(a) - totalOf(b))
  return [...arr].sort((a, b) => relevancePriority(a) - relevancePriority(b))
}


function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function Chevron() {
  return (
    <svg className="h-3.5 w-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const { results, loading, error, search, searchMeta } = useProcedures()
  const { grupos } = useGrupos()
  const { favoritos } = useFavoritos()
  const [view, setView] = useState('cards')
  const [searched, setSearched] = useState(!!initialQuery)

  // Filtros
  const [showFilters, setShowFilters] = useState(false)
  const [filtroGrupo, setFiltroGrupo] = useState(null)
  const [filtroFinanciamento, setFiltroFinanciamento] = useState(null)
  const [valorMin, setValorMin] = useState('')
  const [valorMax, setValorMax] = useState('')
  const [soComDescricao, setSoComDescricao] = useState(false)

  // Ordenação
  const [sortKey, setSortKey] = useState('relevancia')

  // Sheet (painel de detalhe rápido)
  const [sheetProc, setSheetProc] = useState(null)

  // Modo comparação
  const [compareMode, setCompareMode] = useState(false)
  const [compareSelection, setCompareSelection] = useState([])
  const [showCompare, setShowCompare] = useState(false)

  // Modo Urgência/Emergência (global via contexto)
  const { modoUE } = useModoUE()

  // Paginação client-side
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Buscas recentes
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
  })

  // Modo de busca forçado
  const [searchMode, setSearchMode] = useState(null) // null | 'cid' | 'codigo'

  // Drill-down de grupos
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedSubgroup, setSelectedSubgroup] = useState(null)
  const [subgroups, setSubgroups] = useState([])
  const [subgroupProcs, setSubgroupProcs] = useState([])
  const [subgroupLoading, setSubgroupLoading] = useState(false)
  const [procsLoading, setProcsLoading] = useState(false)
  const [procsAtBottom, setProcsAtBottom] = useState(false)
  const procsListRef = useRef(null)

  // CID results para busca universal
  const [cidResults, setCidResults] = useState([])
  const [cidLoading, setCidLoading] = useState(false)

  // Busca inicial via URL
  useEffect(() => {
    if (initialQuery.trim().length >= 3) {
      search(initialQuery)
      searchCids(initialQuery)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Resetar paginação ao mudar resultados ou filtros
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [results, filtroGrupo, filtroFinanciamento, valorMin, valorMax, soComDescricao, sortKey])

  function saveRecentSearch(term) {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  }

  function resetFilters() {
    setFiltroGrupo(null)
    setFiltroFinanciamento(null)
    setValorMin('')
    setValorMax('')
    setSoComDescricao(false)
  }

  function toggleCompareItem(procedure) {
    setCompareSelection(prev => {
      const exists = prev.some(p => p.co_procedimento === procedure.co_procedimento)
      if (exists) return prev.filter(p => p.co_procedimento !== procedure.co_procedimento)
      if (prev.length >= 3) return prev
      return [...prev, procedure]
    })
  }

  async function searchCids(query) {
    const q = query.trim()
    const isNumericCode = /^\d+$/.test(q)
    const isCidCode     = /^[A-Za-z]\d/i.test(q)

    if (q.length < 2 || isNumericCode) { setCidResults([]); return }

    setCidLoading(true)
    try {
      if (isCidCode) {
        const { data } = await supabase
          .from('cid')
          .select('co_cid, no_cid, tp_sexo')
          .ilike('co_cid', `${q.toUpperCase()}%`)
          .order('co_cid')
          .limit(200)
        setCidResults(data || [])
      } else {
        const { expanded } = expandirSinonimos(q)
        const palavras = expanded.toLowerCase().split(/\s+/).filter(w => w.length >= 3)
        const termos = palavras.length > 0 ? palavras : [expanded]
        let { data } = await supabase.rpc('search_cid_unaccent', { search_terms: termos })

        if ((!data || data.length === 0) && termos.length > 1) {
          const buscas = await Promise.all(
            termos.map(t => supabase.rpc('search_cid_unaccent', { search_terms: [t] }))
          )
          const seen = new Set()
          data = buscas.flatMap(r => r.data || []).filter(c => {
            if (seen.has(c.co_cid)) return false
            seen.add(c.co_cid)
            return true
          })
        }

        setCidResults((data || []).slice(0, 200))
      }
    } finally {
      setCidLoading(false)
    }
  }

  function handleModeChange(mode) {
    const newMode = searchMode === mode ? null : mode
    setSearchMode(newMode)
    const currentQ = searchParams.get('q') || ''
    if (currentQ.trim().length >= 2) {
      search(currentQ, newMode)
      if (newMode !== 'codigo') searchCids(currentQ)
      else setCidResults([])
    }
  }

  async function handleSearch(query) {
    const q = query.trim()
    const isCidLike = searchMode === 'cid' || /^[A-Za-z]\d/i.test(q)
    if (q.length >= 3 || (q.length >= 2 && isCidLike)) {
      setSearched(true)
      setSearchParams({ q })
      saveRecentSearch(q)
      resetFilters()
      setSortKey('relevancia')
      setSelectedGroup(null)
      setSelectedSubgroup(null)
      if (searchMode !== 'codigo') searchCids(q)
      else setCidResults([])
    } else {
      setSearched(false)
      setSearchParams({})
      setCidResults([])
    }
    search(query, searchMode)
  }

  // Chamado ao clicar "Procedimentos →" em um CID específico
  function handleCidSelect(code) {
    setCidResults([])
    setSearched(true)
    setSearchParams({ q: code })
    saveRecentSearch(code)
    resetFilters()
    setSortKey('relevancia')
    search(code, null)
  }

  async function handleGroupClick(g) {
    if (selectedGroup?.co_grupo === g.co_grupo) {
      setSelectedGroup(null); setSelectedSubgroup(null)
      setSubgroups([]); setSubgroupProcs([])
      return
    }
    setSelectedGroup(g)
    setSelectedSubgroup(null)
    setSubgroupProcs([])
    setSubgroupLoading(true)
    const { data } = await supabase.rpc('listar_subgrupos', { p_co_grupo: g.co_grupo })
    setSubgroups(data || [])
    setSubgroupLoading(false)
  }

  async function handleSubgroupClick(s) {
    if (selectedSubgroup?.co_subgrupo === s.co_subgrupo) {
      setSelectedSubgroup(null); setSubgroupProcs([]); return
    }
    setSelectedSubgroup(s)
    setProcsLoading(true)
    setProcsAtBottom(false)
    const { data } = await supabase.rpc('listar_procedimentos_grupo', {
      p_co_grupo: selectedGroup.co_grupo,
      p_co_subgrupo: s.co_subgrupo,
      limite: 50,
    })
    setSubgroupProcs(data || [])
    setProcsLoading(false)
  }

  // Derivados
  const gruposPresentes = [...new Set(
    results.map(p => p.co_procedimento?.slice(0, 2)).filter(Boolean)
  )].sort()

  const financiamentosPresentes = [...new Map(
    results
      .filter(p => p.tp_financiamento)
      .map(p => [p.tp_financiamento, { tp: p.tp_financiamento, no: p.no_financiamento }])
  ).values()].sort((a, b) => a.tp.localeCompare(b.tp))

  const filteredResults = results.filter(p => {
    const total = totalOf(p)
    const grupo = p.co_procedimento?.slice(0, 2)
    if (modoUE && !['03', '04'].includes(grupo)) return false
    if (filtroGrupo && grupo !== filtroGrupo) return false
    if (filtroFinanciamento && p.tp_financiamento !== filtroFinanciamento) return false
    if (valorMin !== '' && total < parseFloat(valorMin)) return false
    if (valorMax !== '' && total > parseFloat(valorMax)) return false
    if (soComDescricao && p.ds_procedimento !== undefined && !p.ds_procedimento) return false
    return true
  })

  const sortedResults  = applySort(filteredResults, sortKey)
  const visibleResults = sortedResults.slice(0, visibleCount)
  const hasMore        = sortedResults.length > visibleCount
  const filtrosAtivos     = [filtroFinanciamento, valorMin, valorMax, soComDescricao].filter(Boolean).length
  const activeModeIndex   = SEARCH_MODES.findIndex(m => m.mode === searchMode)
  const selectedEstilo    = selectedGroup ? GRUPO_MAP[selectedGroup.co_grupo] : null
  const totalProcedimentos = grupos.reduce((s, g) => s + Number(g.qt_procedimentos), 0)
  const gruposVisiveis = modoUE ? grupos.filter(g => ['03', '04'].includes(g.co_grupo)) : grupos

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className={modoUE ? "bg-gradient-to-br from-red-950 via-red-900 to-red-800" : "bg-[#0A1628] bg-gradient-to-br from-[#0A1628] via-[#0D2347] to-[#0F3460]"}>
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 text-center">
          <Link to="/" className="block hover:opacity-80 transition-opacity">
            <h1 className="text-6xl text-white tracking-widest"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}>SIGTAPP</h1>
          </Link>
          <p className={cn("mt-2 text-sm tracking-wide", modoUE ? "text-red-300/80" : "text-blue-300/70")}>
            Procedimentos, Medicamentos e OPM do SUS · CID-10
          </p>
          <div className="mt-6">
            <SearchBar
              onSearch={handleSearch}
              loading={loading}
              initialValue={initialQuery}
              recentSearches={recentSearches}
              onSelectRecent={saveRecentSearch}
            />
          </div>

          {/* Segmented control */}
          <div className="mt-4 flex justify-center">
            <div className="relative grid grid-cols-3 rounded-full bg-white/20">
              {/* Sliding indicator */}
              <div
                aria-hidden
                className="absolute inset-y-0 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out"
                style={{
                  width: 'calc(100% / 3)',
                  transform: `translateX(calc(${activeModeIndex} * 100%))`,
                }}
              />
              {SEARCH_MODES.map(({ mode, label }) => (
                <button
                  key={mode ?? 'tudo'}
                  onClick={() => handleModeChange(mode)}
                  className={`relative z-10 rounded-full px-6 py-1.5 text-center text-xs font-semibold transition-colors duration-150 ${
                    searchMode === mode
                      ? modoUE ? 'text-red-700' : 'text-blue-700'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Erro ao buscar: {error}
          </div>
        )}

        {/* CID results — busca universal */}
        {(cidLoading || cidResults.length > 0) && (
          <div className="mb-5 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Diagnósticos CID-10 relacionados
            </p>
            <div className="grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
              {cidLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                      <Skeleton className="h-4 w-10 shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-6 w-24 shrink-0 rounded-md" />
                    </div>
                  ))
                : cidResults.map((cid) => (
                    <TooltipProvider key={cid.co_cid} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-indigo-100/60 transition cursor-default">
                            <span className="w-12 shrink-0 font-mono text-sm font-bold text-indigo-700">
                              {cid.co_cid.trim()}
                            </span>
                            <span className="flex-1 text-sm text-slate-700 truncate">{cid.no_cid?.trim()}</span>
                            <button
                              onClick={() => handleCidSelect(cid.co_cid.trim())}
                              className="shrink-0 rounded-md border border-blue-200 bg-white px-2.5 py-1
                                         text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                            >
                              Procedimentos →
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center">
                          <span className="font-mono font-bold mr-1">{cid.co_cid.trim()}</span>
                          {cid.no_cid?.trim()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
              }
            </div>
          </div>
        )}

        {/* Skeleton loading — visível enquanto carrega a primeira busca */}
        {loading && searched && results.length === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProcedureCardSkeleton key={i} />
            ))}
          </div>
        )}

        {results.length > 0 && (cidResults.length === 0 || searchMode === null) && (
          <div className="flex gap-6">

            {/* Sidebar — grupos presentes nos resultados */}
            {gruposPresentes.length > 1 && (
              <aside className="hidden lg:block w-56 shrink-0">
                <div className="sticky top-[60px] overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grupos</p>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-[80vh] overflow-y-auto">
                    <button
                      onClick={() => setFiltroGrupo(null)}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition ${
                        !filtroGrupo
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs leading-snug">Todos</span>
                      <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        {results.length.toLocaleString('pt-BR')}
                      </span>
                    </button>
                    {gruposPresentes.map(g => {
                      const estilo = GRUPO_MAP[g]
                      const count = results.filter(p => p.co_procedimento?.slice(0, 2) === g).length
                      const isActive = filtroGrupo === g
                      return (
                        <button
                          key={g}
                          onClick={() => setFiltroGrupo(isActive ? null : g)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition ${
                            isActive
                              ? `${estilo?.bg ?? 'bg-blue-50'} ${estilo?.text ?? 'text-blue-700'} font-medium`
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs leading-snug">{estilo?.no ?? g}</span>
                          <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                            {count.toLocaleString('pt-BR')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </aside>
            )}

            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0">

              {/* Controls */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {sortedResults.length}
                  {filtrosAtivos > 0 && ` de ${results.length}`} resultado{sortedResults.length !== 1 ? 's' : ''}
                  {hasMore && <span className="text-slate-400"> · mostrando {visibleCount}</span>}
                </p>

                <div className="flex items-center gap-2">
                  <Select value={sortKey} onValueChange={setSortKey}>
                    <SelectTrigger className="h-8 w-36 text-xs text-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(financiamentosPresentes.length > 1 || valorMin || valorMax || soComDescricao) && (
                    <button
                      onClick={() => setShowFilters(s => !s)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
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

                  <button
                    onClick={() => { setCompareMode(m => !m); setCompareSelection([]) }}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      compareMode
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Comparar
                  </button>

                  <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                    {VIEW_MODES.map((m) => (
                      <button
                        key={m}
                        onClick={() => setView(m)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                          view === m ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
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

                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={soComDescricao}
                      onChange={e => setSoComDescricao(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Só procedimentos com descrição</span>
                  </label>

                  {filtrosAtivos > 0 && (
                    <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Results grid */}
              {visibleResults.length > 0 && (
                view === 'cards' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {visibleResults.map((p) => (
                      <ProcedureCard
                        key={p.co_procedimento}
                        procedure={p}
                        onSelect={compareMode ? undefined : setSheetProc}
                        compareMode={compareMode}
                        compareSelected={compareSelection.some(c => c.co_procedimento === p.co_procedimento)}
                        onToggleCompare={toggleCompareItem}
                      />
                    ))}
                  </div>
                ) : (
                  <ProcedureTable
                    results={visibleResults}
                    onSelect={compareMode ? undefined : setSheetProc}
                    compareMode={compareMode}
                    compareSelection={compareSelection}
                    onToggleCompare={toggleCompareItem}
                  />
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

              {!loading && searched && results.length > 0 && sortedResults.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-600">Nenhum resultado com esses filtros</p>
                  <button onClick={resetFilters} className="mt-2 text-xs text-blue-600 hover:underline">
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && searchMode !== 'cid' && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-slate-600">Nenhum procedimento encontrado</p>
            <p className="mt-1 text-xs text-slate-400">Tente outros termos ou verifique o código</p>
          </div>
        )}

        {/* ── Estado inicial — grupos com drill-down ── */}
        {!searched && (
          <div>
            {/* Favoritos */}
            {favoritos.length > 0 && (
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <svg className="h-4 w-4 fill-amber-400 text-amber-400" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    Favoritos
                  </h2>
                  <Link to="/favoritos" className="text-xs text-slate-400 hover:text-blue-600 transition">
                    {favoritos.length} procedimento{favoritos.length !== 1 ? 's' : ''} · Ver todos →
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favoritos.slice(0, 6).map(p => (
                    <ProcedureCard key={p.co_procedimento} procedure={p} onSelect={setSheetProc} />
                  ))}
                </div>
                {favoritos.length > 6 && (
                  <div className="mt-3 text-center">
                    <Link to="/favoritos" className="text-xs text-blue-600 hover:underline">
                      Ver todos os {favoritos.length} favoritos →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Breadcrumb — só aparece quando um grupo está selecionado */}
            {selectedGroup && (
              <div className={cn(
                "mb-4 flex items-center rounded-xl px-4 py-2.5 border transition-colors",
                cn(selectedEstilo?.bg, selectedEstilo?.border)
              )}>
                <nav className="flex items-center gap-1.5 text-sm">
                  <button
                    onClick={() => {
                      setSelectedGroup(null); setSelectedSubgroup(null)
                      setSubgroups([]); setSubgroupProcs([])
                    }}
                    className={cn("font-medium hover:underline", selectedEstilo?.text ?? "text-blue-600")}
                  >
                    Grupos
                  </button>
                  <svg className={cn("h-3.5 w-3.5 opacity-50", selectedEstilo?.text ?? "text-slate-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <button
                    onClick={() => { setSelectedSubgroup(null); setSubgroupProcs([]) }}
                    className={cn(
                      "font-medium",
                      selectedSubgroup ? cn(selectedEstilo?.text, "hover:underline") : cn(selectedEstilo?.text, "cursor-default")
                    )}
                  >
                    {selectedGroup.no_grupo}
                  </button>
                  {selectedSubgroup && (
                    <>
                      <svg className={cn("h-3.5 w-3.5 opacity-50", selectedEstilo?.text ?? "text-slate-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={cn("font-semibold", selectedEstilo?.text ?? "text-slate-700")}>
                        {selectedSubgroup.no_subgrupo}
                      </span>
                    </>
                  )}
                </nav>
              </div>
            )}

            {/* Painéis */}
            <div className="flex flex-col md:flex-row items-start gap-3">

              {/* Painel 1 — Groups */}
              <div className={`w-full transition-all duration-300 ease-in-out ${
                selectedGroup ? 'md:w-52 md:shrink-0' : ''
              }`}>
                {!selectedGroup ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gruposVisiveis.map((g) => {
                      const estilo = GRUPO_MAP[g.co_grupo]
                      if (!estilo) return null
                      return (
                        <button
                          key={g.co_grupo}
                          onClick={() => handleGroupClick(g)}
                          className="group flex items-center gap-3 overflow-hidden rounded-xl
                                     bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] text-left transition
                                     hover:shadow-[0_6px_20px_rgba(15,23,42,0.10),0_2px_6px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <span className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${estilo.bg} ${estilo.text}`}>
                            {g.co_grupo}
                          </span>
                          <p className="text-sm font-semibold leading-snug text-slate-800 group-hover:text-slate-900">
                            {g.no_grupo}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
                    {gruposVisiveis.map((g) => {
                      const estilo = GRUPO_MAP[g.co_grupo]
                      if (!estilo) return null
                      const isActive = g.co_grupo === selectedGroup.co_grupo
                      return (
                        <button
                          key={g.co_grupo}
                          onClick={() => handleGroupClick(g)}
                          className={cn(
                            "relative flex w-full items-center gap-2.5 overflow-hidden border-b border-slate-50 px-3 py-2.5 text-left transition last:border-0",
                            isActive ? cn(estilo.bg, estilo.text, "font-medium") : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          )}
                        >
                          <div className={cn("absolute left-0 top-0 h-full w-[3px]", isActive ? estilo.dot : "bg-slate-100")} />
                          <span className={cn(
                            "ml-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[10px] font-bold",
                            isActive ? cn(estilo.dot, "text-white") : "bg-slate-100 text-slate-400"
                          )}>
                            {g.co_grupo}
                          </span>
                          <span className="text-xs leading-snug">{estilo.no}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Painel 2 — Subgrupos */}
              {selectedGroup && (
                <div
                  key={selectedGroup.co_grupo}
                  className={`w-full animate-slide-right transition-all duration-300 md:shrink-0 ${
                    selectedSubgroup ? 'md:w-64' : 'md:w-72'
                  }`}
                >
                  <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", selectedEstilo?.dot)} />
                      <span className="text-xs font-semibold text-slate-700">{selectedGroup.no_grupo}</span>
                    </div>

                    {subgroupLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {subgroups.map((s) => {
                          const isActive = s.co_subgrupo === selectedSubgroup?.co_subgrupo
                          return (
                            <button
                              key={s.co_subgrupo}
                              onClick={() => handleSubgroupClick(s)}
                              className={cn(
                                "relative flex w-full items-center justify-between gap-3 overflow-hidden px-4 py-3 text-left transition",
                                isActive
                                  ? cn(selectedEstilo?.bg ?? "bg-blue-50", selectedEstilo?.text ?? "text-blue-700", "font-medium")
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              )}
                            >
                              <div className={cn("absolute left-0 top-0 h-full w-[3px]", isActive ? selectedEstilo?.dot : "bg-transparent")} />
                              <span className="flex-1 pl-1 text-sm leading-snug">{s.no_subgrupo}</span>
                              <span className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums",
                                isActive
                                  ? cn("font-semibold", selectedEstilo?.bg, selectedEstilo?.text)
                                  : "bg-slate-100 text-slate-400"
                              )}>
                                {Number(s.qt_procedimentos).toLocaleString('pt-BR')}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    <div className="border-t border-slate-100 px-4 py-2.5">
                      <Link
                        to={`/grupo/${selectedGroup.co_grupo}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Ver todos os procedimentos →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Painel 3 — Procedimentos */}
              {selectedSubgroup && (
                <div
                  key={selectedSubgroup.co_subgrupo}
                  className="w-full md:flex-1 animate-slide-right"
                >
                  <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", selectedEstilo?.dot)} />
                      <p className="text-xs font-semibold leading-snug text-slate-700">{selectedSubgroup.no_subgrupo}</p>
                    </div>

                    {procsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="relative">
                        <div
                          ref={procsListRef}
                          onScroll={e => {
                            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
                            setProcsAtBottom(scrollTop + clientHeight >= scrollHeight - 10)
                          }}
                          className="max-h-96 overflow-y-auto divide-y divide-slate-50"
                        >
                          {subgroupProcs.map((p) => (
                            <button
                              key={p.co_procedimento}
                              onClick={() => setSheetProc(p)}
                              className="group relative flex w-full items-center gap-3 overflow-hidden px-4 py-3 text-left transition hover:bg-slate-50"
                            >
                              <div className={cn("absolute left-0 top-0 h-full w-[3px]", selectedEstilo?.dot ?? "bg-slate-200")} />
                              <div className="min-w-0 flex-1 pl-1">
                                <p className="font-mono text-[10px] text-slate-400">{formatCodigo(p.co_procedimento)}</p>
                                <p className="mt-0.5 text-sm leading-snug text-slate-700 group-hover:text-slate-900">
                                  {p.no_procedimento}
                                </p>
                              </div>
                              <svg className="h-3.5 w-3.5 shrink-0 text-slate-200 transition group-hover:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                        </div>
                        {!procsAtBottom && subgroupProcs.length > 7 && (
                          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white to-transparent" />
                        )}
                      </div>
                    )}

                    {subgroupProcs.length >= 50 && (
                      <div className="border-t border-slate-100 px-4 py-2.5">
                        <Link
                          to={`/grupo/${selectedGroup.co_grupo}`}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Ver todos os {Number(selectedSubgroup.qt_procedimentos).toLocaleString('pt-BR')} procedimentos →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* Sheet — painel de detalhe rápido */}
      <Sheet open={!!sheetProc} onOpenChange={open => !open && setSheetProc(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {sheetProc && <ProcedureSheetContent procedure={sheetProc} />}
        </SheetContent>
      </Sheet>

      {/* Dialog — comparação de procedimentos */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comparação de procedimentos</DialogTitle>
          </DialogHeader>
          <div className={`grid gap-4 mt-2 ${compareSelection.length === 3 ? 'grid-cols-3' : compareSelection.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {compareSelection.map(p => {
              const total = (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
              const estilo = GRUPO_MAP[p.co_procedimento?.slice(0, 2)]
              return (
                <div key={p.co_procedimento} className="space-y-3">
                  <div className={cn('rounded-lg p-3', estilo?.bg ?? 'bg-slate-100')}>
                    <p className={cn('font-mono text-[11px]', estilo?.text ?? 'text-slate-400')}>
                      {p.co_procedimento}
                    </p>
                    <p className={cn('mt-1 text-sm font-semibold leading-snug', estilo?.text ?? 'text-slate-800')}>
                      {p.no_procedimento}
                    </p>
                  </div>
                  <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    {[
                      { label: 'Ambulatorial (SA)', value: p.vl_sa },
                      { label: 'Hospitalar (SH)', value: p.vl_sh },
                      { label: 'Profissional (SP)', value: p.vl_sp },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="tabular-nums text-sm font-medium text-slate-700">{formatBRL(value)}</p>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2">
                      <p className="text-xs text-emerald-600">Total SUS</p>
                      <p className="tabular-nums text-lg font-bold text-emerald-700">{formatBRL(total)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Barra flutuante de comparação */}
      {compareMode && compareSelection.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xl">
            <span className="text-sm text-slate-600">
              {compareSelection.length}/3 selecionado{compareSelection.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowCompare(true)}
              disabled={compareSelection.length < 2}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white
                         transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Comparar
            </button>
            <button
              onClick={() => setCompareSelection([])}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600
                         transition hover:bg-slate-50"
            >
              Limpar
            </button>
          </div>
        </div>
      )}


    </div>
  )
}
