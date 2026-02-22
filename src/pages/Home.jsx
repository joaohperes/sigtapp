import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { ProcedureCard } from '../components/ProcedureCard'
import { ProcedureTable } from '../components/ProcedureTable'
import { useProcedures } from '../hooks/useProcedures'
import { useGrupos } from '../hooks/useGrupos'
import { GRUPO_MAP } from '../data/grupos'

const VIEW_MODES = ['cards', 'tabela']
const EXEMPLOS = ['colecistectomia', 'endoscopia', 'ressonância magnética', '0407010005']
const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'nome_az', label: 'Nome A→Z' },
  { value: 'nome_za', label: 'Nome Z→A' },
  { value: 'maior_valor', label: 'Maior valor' },
  { value: 'menor_valor', label: 'Menor valor' },
]
const PAGE_SIZE = 30
const RECENT_KEY = 'sigtap-recent'

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

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const { results, loading, error, search, searchMeta } = useProcedures()
  const { grupos } = useGrupos()
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

  // Paginação client-side
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Buscas recentes
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
  })

  // Busca inicial via URL
  useEffect(() => {
    if (initialQuery.trim().length >= 3) {
      search(initialQuery)
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

  function handleSearch(query) {
    if (query.trim().length >= 3) {
      setSearched(true)
      setSearchParams({ q: query.trim() })
      saveRecentSearch(query.trim())
      resetFilters()
      setSortKey('relevancia')
    } else {
      setSearched(false)
      setSearchParams({})
    }
    search(query)
  }

  // Opções de filtro derivadas dos resultados
  const gruposPresentes = [...new Set(
    results.map(p => p.co_procedimento?.slice(0, 2)).filter(Boolean)
  )].sort()

  const financiamentosPresentes = [...new Map(
    results
      .filter(p => p.tp_financiamento)
      .map(p => [p.tp_financiamento, { tp: p.tp_financiamento, no: p.no_financiamento }])
  ).values()].sort((a, b) => a.tp.localeCompare(b.tp))

  // Aplicar filtros
  const filteredResults = results.filter(p => {
    const total = totalOf(p)
    const grupo = p.co_procedimento?.slice(0, 2)
    if (filtroGrupo && grupo !== filtroGrupo) return false
    if (filtroFinanciamento && p.tp_financiamento !== filtroFinanciamento) return false
    if (valorMin !== '' && total < parseFloat(valorMin)) return false
    if (valorMax !== '' && total > parseFloat(valorMax)) return false
    if (soComDescricao && p.ds_procedimento !== undefined && !p.ds_procedimento) return false
    return true
  })

  // Aplicar ordenação
  const sortedResults = applySort(filteredResults, sortKey)

  // Paginação
  const visibleResults = sortedResults.slice(0, visibleCount)
  const hasMore = sortedResults.length > visibleCount

  const filtrosAtivos = [filtroGrupo, filtroFinanciamento, valorMin, valorMax, soComDescricao].filter(Boolean).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
            Ministério da Saúde · DATASUS
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">SIGTAP</h1>
          <p className="mt-1.5 text-sm text-blue-200">
            Tabela de Procedimentos, Medicamentos e OPM do SUS
          </p>

          <div className="mt-8">
            <SearchBar
              onSearch={handleSearch}
              loading={loading}
              initialValue={initialQuery}
              recentSearches={recentSearches}
              onSelectRecent={saveRecentSearch}
            />
          </div>

          {!searched && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXEMPLOS.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-blue-100
                             hover:bg-white/20 transition"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5">
            <Link
              to="/cid"
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40
                         bg-blue-900/30 px-4 py-1.5 text-xs text-blue-200 transition hover:bg-blue-900/50"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Buscar por CID-10 (D.O., laudos)
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Erro ao buscar: {error}
          </div>
        )}

        {results.length > 0 && (
          <>
            {/* CID banner */}
            {searchMeta?.type === 'cid' && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                <span className="font-mono font-semibold">{searchMeta.co_cid}</span>
                {searchMeta.no_cid && <span className="text-blue-600">— {searchMeta.no_cid}</span>}
              </div>
            )}

            {/* Results header */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {sortedResults.length}
                {filtrosAtivos > 0 && ` de ${results.length}`} resultado{sortedResults.length !== 1 ? 's' : ''}
                {hasMore && <span className="text-slate-400"> · mostrando {visibleCount}</span>}
              </p>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs
                             text-slate-600 shadow-sm focus:border-blue-400 focus:outline-none"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Filter toggle */}
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

                {/* View toggle */}
                <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                  {VIEW_MODES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setView(m)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
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
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                {/* Grupo */}
                {gruposPresentes.length > 1 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Grupo</p>
                    <div className="flex flex-wrap gap-2">
                      {gruposPresentes.map(g => {
                        const estilo = GRUPO_MAP[g]
                        const active = filtroGrupo === g
                        return (
                          <button
                            key={g}
                            onClick={() => setFiltroGrupo(active ? null : g)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              active
                                ? `${estilo?.bg ?? 'bg-blue-100'} ${estilo?.text ?? 'text-blue-700'} border-transparent`
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {g} — {estilo?.no ?? g}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Financiamento */}
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

                {/* Valor */}
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

                {/* Só com descrição */}
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
          </>
        )}

        {/* Results */}
        {visibleResults.length > 0 && (
          view === 'cards' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleResults.map((p) => (
                <ProcedureCard key={p.co_procedimento} procedure={p} />
              ))}
            </div>
          ) : (
            <ProcedureTable results={visibleResults} />
          )
        )}

        {/* Carregar mais */}
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

        {/* Vazio após filtro */}
        {!loading && searched && results.length > 0 && sortedResults.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-600">Nenhum resultado com esses filtros</p>
            <button onClick={resetFilters} className="mt-2 text-xs text-blue-600 hover:underline">
              Limpar filtros
            </button>
          </div>
        )}

        {/* Sem resultados */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-slate-600">Nenhum procedimento encontrado</p>
            <p className="mt-1 text-xs text-slate-400">Tente outros termos ou verifique o código</p>
          </div>
        )}

        {/* Estado inicial — grupos */}
        {!searched && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Navegar por grupo</h2>
              <span className="text-xs text-slate-400">
                {grupos.reduce((s, g) => s + Number(g.qt_procedimentos), 0).toLocaleString('pt-BR')} procedimentos
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grupos.map((g) => {
                const estilo = GRUPO_MAP[g.co_grupo]
                if (!estilo) return null
                return (
                  <Link
                    key={g.co_grupo}
                    to={`/grupo/${g.co_grupo}`}
                    className="group relative flex items-start gap-4 overflow-hidden rounded-xl
                               border border-slate-200 bg-white p-5 shadow-sm transition
                               hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className={`absolute left-0 top-0 h-full w-1 ${estilo.dot}`} />
                    <div className="pl-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold
                                       ${estilo.bg} ${estilo.text}`}>
                        {g.co_grupo}
                      </span>
                      <p className="mt-2 text-sm font-medium leading-snug text-slate-800">
                        {g.no_grupo}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {Number(g.qt_procedimentos).toLocaleString('pt-BR')} procedimentos
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
