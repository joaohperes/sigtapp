import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGrupoProcedimentos } from '../hooks/useGrupos'
import { GRUPO_MAP } from '../data/grupos'
import { ProcedureCard } from '../components/ProcedureCard'
import { ProcedureTable } from '../components/ProcedureTable'

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

  const grupo = GRUPO_MAP[co]
  const { procedimentos, subgrupos, loading } = useGrupoProcedimentos(co, subgrupoAtivo)

  useEffect(() => {
    if (grupo) {
      document.title = `${grupo.no} — SIGTAP`
      return () => { document.title = 'SIGTAP — Tabela de Procedimentos SUS' }
    }
  }, [grupo])

  // Opções de financiamento derivadas dos procedimentos
  const financiamentosPresentes = [...new Map(
    procedimentos
      .filter(p => p.tp_financiamento)
      .map(p => [p.tp_financiamento, { tp: p.tp_financiamento, no: p.no_financiamento }])
  ).values()].sort((a, b) => a.tp.localeCompare(b.tp))

  // Resetar paginação ao mudar filtros
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [procedimentos, filtroTexto, filtroFinanciamento, valorMin, valorMax, sortKey])

  function resetFilters() {
    setFiltroFinanciamento(null)
    setValorMin('')
    setValorMax('')
  }

  const filtrosAtivos = [filtroFinanciamento, valorMin, valorMax].filter(Boolean).length

  // Aplicar filtros
  const filteredResults = procedimentos.filter(p => {
    if (filtroTexto.trim().length >= 2 && !p.no_procedimento.toLowerCase().includes(filtroTexto.toLowerCase())) return false
    if (filtroFinanciamento && p.tp_financiamento !== filtroFinanciamento) return false
    const total = totalOf(p)
    if (valorMin !== '' && total < parseFloat(valorMin)) return false
    if (valorMax !== '' && total > parseFloat(valorMax)) return false
    return true
  })

  // Aplicar ordenação
  const sortedResults = applySort(filteredResults, sortKey)

  // Paginação
  const visibleResults = sortedResults.slice(0, visibleCount)
  const hasMore = sortedResults.length > visibleCount

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
      {/* Header colorido */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600">
        <div className="mx-auto max-w-5xl px-4 py-8">
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

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Filtro por subgrupo */}
        {subgrupos.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subgrupo
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSubgrupoAtivo(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                  subgrupoAtivo === null
                    ? `${grupo.bg} ${grupo.text} ${grupo.border}`
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Todos ({subgrupos.reduce((s, g) => s + Number(g.qt_procedimentos), 0)})
              </button>
              {subgrupos.map((s) => (
                <button
                  key={s.co_subgrupo}
                  onClick={() => setSubgrupoAtivo(
                    s.co_subgrupo === subgrupoAtivo ? null : s.co_subgrupo
                  )}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                    s.co_subgrupo === subgrupoAtivo
                      ? `${grupo.bg} ${grupo.text} ${grupo.border}`
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s.no_subgrupo} ({s.qt_procedimentos})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Busca local */}
        <input
          type="text"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          placeholder="Filtrar por nome neste grupo..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm
                     placeholder:text-slate-400 focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500/20"
        />

        {/* Cabeçalho resultados */}
        {!loading && (
          <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {sortedResults.length}
              {filtrosAtivos > 0 && ` de ${procedimentos.length}`} procedimento{sortedResults.length !== 1 ? 's' : ''}
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
              {financiamentosPresentes.length > 0 && (
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
        )}

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
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

            {filtrosAtivos > 0 && (
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="py-20 text-center text-sm text-slate-400">Carregando...</div>
        )}

        {!loading && visibleResults.length > 0 && (
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
      </main>
    </div>
  )
}
