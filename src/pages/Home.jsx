import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { ProcedureCard } from '../components/ProcedureCard'
import { ProcedureTable } from '../components/ProcedureTable'
import { useProcedures } from '../hooks/useProcedures'
import { useGrupos } from '../hooks/useGrupos'
import { GRUPO_MAP } from '../data/grupos'

const VIEW_MODES = ['cards', 'tabela']
const EXEMPLOS = ['colecistectomia', 'endoscopia', 'ressonância magnética', '0407010005']

export function Home() {
  const { results, loading, error, search, searchMeta } = useProcedures()
  const { grupos } = useGrupos()
  const [view, setView] = useState('cards')
  const [searched, setSearched] = useState(false)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filtroGrupo, setFiltroGrupo] = useState(null)
  const [filtroFinanciamento, setFiltroFinanciamento] = useState(null)
  const [valorMin, setValorMin] = useState('')
  const [valorMax, setValorMax] = useState('')
  const [soComDescricao, setSoComDescricao] = useState(false)

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
      resetFilters()
    } else {
      setSearched(false)
    }
    search(query)
  }

  // Derived filter options from current results
  const gruposPresentes = [...new Set(
    results.map(p => p.co_procedimento?.slice(0, 2)).filter(Boolean)
  )].sort()

  const financiamentosPresentes = [...new Map(
    results
      .filter(p => p.tp_financiamento)
      .map(p => [p.tp_financiamento, { tp: p.tp_financiamento, no: p.no_financiamento }])
  ).values()].sort((a, b) => a.tp.localeCompare(b.tp))

  // Apply filters
  const filteredResults = results.filter(p => {
    const total = (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
    const grupo = p.co_procedimento?.slice(0, 2)
    if (filtroGrupo && grupo !== filtroGrupo) return false
    if (filtroFinanciamento && p.tp_financiamento !== filtroFinanciamento) return false
    if (valorMin !== '' && total < parseFloat(valorMin)) return false
    if (valorMax !== '' && total > parseFloat(valorMax)) return false
    if (soComDescricao && p.ds_procedimento !== undefined && !p.ds_procedimento) return false
    return true
  })

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
            <SearchBar onSearch={handleSearch} loading={loading} />
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
                {filteredResults.length}
                {filtrosAtivos > 0 && ` de ${results.length}`} resultado{filteredResults.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
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

                {/* Clear filters */}
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
        {filteredResults.length > 0 && (
          view === 'cards' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredResults.map((p) => (
                <ProcedureCard key={p.co_procedimento} procedure={p} />
              ))}
            </div>
          ) : (
            <ProcedureTable results={filteredResults} />
          )
        )}

        {/* Empty after filtering */}
        {!loading && searched && results.length > 0 && filteredResults.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-600">Nenhum resultado com esses filtros</p>
            <button onClick={resetFilters} className="mt-2 text-xs text-blue-600 hover:underline">
              Limpar filtros
            </button>
          </div>
        )}

        {/* Empty - no results */}
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
