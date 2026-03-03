import { Link } from 'react-router-dom'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'

export function ProcedureCard({ procedure }) {
  const { co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, no_financiamento } = procedure
  const total = (vl_sa || 0) + (vl_sh || 0) + (vl_sp || 0)
  const estilo = GRUPO_MAP[co_procedimento?.slice(0, 2)]

  return (
    <Link
      to={`/procedimento/${co_procedimento}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200
                 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Faixa de cor do grupo */}
      {estilo && <div className={`h-1 w-full ${estilo.dot}`} />}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-slate-400">{formatCodigo(co_procedimento)}</p>
            <p className="mt-1 text-sm font-medium leading-snug text-slate-800 line-clamp-2">
              {no_procedimento}
            </p>
            {no_financiamento && (
              <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {no_financiamento}
              </span>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-slate-400">Total SUS</p>
            <p className="text-base font-bold text-emerald-600">{formatBRL(total)}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <ValueCell label="Ambulatorial" value={vl_sa} />
          <ValueCell label="Hospitalar" value={vl_sh} />
          <ValueCell label="Profissional" value={vl_sp} />
        </div>
      </div>
    </Link>
  )
}

function ValueCell({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm tabular-nums text-slate-700">{formatBRL(value)}</p>
    </div>
  )
}

export function ProcedureRow({ procedure }) {
  const { co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, no_financiamento } = procedure
  const total = (vl_sa || 0) + (vl_sh || 0) + (vl_sp || 0)
  const estilo = GRUPO_MAP[co_procedimento?.slice(0, 2)]

  function handleCopyCodigo(e) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(co_procedimento.replace(/\D/g, ''))
  }

  return (
    <Link
      to={`/procedimento/${co_procedimento}`}
      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white
                 px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      {estilo && <div className={`h-8 w-1 shrink-0 rounded-full ${estilo.dot}`} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="font-mono text-xs text-slate-400">{formatCodigo(co_procedimento)}</p>
          <button
            type="button"
            onClick={handleCopyCodigo}
            className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
            title="Copiar código"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <p className="text-sm font-medium leading-snug text-slate-800">{no_procedimento}</p>
        {no_financiamento && (
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {no_financiamento}
          </span>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-slate-400">Total SUS</p>
        <p className="text-sm font-bold text-emerald-600">{formatBRL(total)}</p>
      </div>
    </Link>
  )
}
