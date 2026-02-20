import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGrupoProcedimentos } from '../hooks/useGrupos'
import { GRUPO_MAP } from '../data/grupos'
import { ProcedureCard } from '../components/ProcedureCard'
import { ProcedureTable } from '../components/ProcedureTable'

const VIEW_MODES = ['cards', 'tabela']

export function GroupPage() {
  const { co } = useParams()
  const [subgrupoAtivo, setSubgrupoAtivo] = useState(null)
  const [view, setView] = useState('cards')
  const [filtro, setFiltro] = useState('')

  const grupo = GRUPO_MAP[co]
  const { procedimentos, subgrupos, loading } = useGrupoProcedimentos(co, subgrupoAtivo)

  const visíveis = filtro.trim().length >= 2
    ? procedimentos.filter((p) =>
        p.no_procedimento.toLowerCase().includes(filtro.toLowerCase())
      )
    : procedimentos

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
      <div className={`bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600`}>
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
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por nome neste grupo..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm
                     placeholder:text-slate-400 focus:border-blue-500 focus:outline-none
                     focus:ring-2 focus:ring-blue-500/20"
        />

        {/* Cabeçalho resultados */}
        {!loading && (
          <div className="mt-5 mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {visíveis.length} procedimento{visíveis.length !== 1 ? 's' : ''}
            </p>
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
        )}

        {loading && (
          <div className="py-20 text-center text-sm text-slate-400">Carregando...</div>
        )}

        {!loading && visíveis.length > 0 && (
          view === 'cards' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {visíveis.map((p) => (
                <ProcedureCard key={p.co_procedimento} procedure={p} />
              ))}
            </div>
          ) : (
            <ProcedureTable results={visíveis} />
          )
        )}

        {!loading && visíveis.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-slate-600">Nenhum procedimento encontrado</p>
            <p className="mt-1 text-xs text-slate-400">Tente outro subgrupo ou termo</p>
          </div>
        )}
      </main>
    </div>
  )
}
