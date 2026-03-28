import { useNavigate } from 'react-router-dom'
import { formatBRL, formatCodigo, exportCsv } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'

export function ProcedureTable({ results, onSelect, compareMode, compareSelection, onToggleCompare }) {
  const navigate = useNavigate()
  if (!results.length) return null

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => exportCsv(results)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5
                     text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="w-[3px] p-0" />
              {compareMode && <th className="w-10 px-4 py-3" />}
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 whitespace-nowrap">Código</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Procedimento</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 whitespace-nowrap">SA</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 whitespace-nowrap">SH</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 whitespace-nowrap">SP</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((p) => {
              const total = (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
              const estilo = GRUPO_MAP[p.co_procedimento?.slice(0, 2)]
              const selected = compareSelection?.some(c => c.co_procedimento === p.co_procedimento)
              const handleClick = compareMode
                ? () => onToggleCompare?.(p)
                : () => onSelect ? onSelect(p) : navigate(`/procedimento/${p.co_procedimento}`)
              return (
                <tr
                  key={p.co_procedimento}
                  onClick={handleClick}
                  className={`cursor-pointer transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-blue-50/50'}`}
                >
                  <td className={`w-[3px] p-0 ${estilo?.dot ?? 'bg-slate-200'}`} />
                  {compareMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => onToggleCompare?.(p)}
                        onClick={e => e.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-mono text-xs ${estilo?.text ?? 'text-slate-400'}`}>
                      {formatCodigo(p.co_procedimento)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.no_procedimento}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 whitespace-nowrap">{formatBRL(p.vl_sa)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 whitespace-nowrap">{formatBRL(p.vl_sh)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 whitespace-nowrap">{formatBRL(p.vl_sp)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700 whitespace-nowrap">
                    {formatBRL(total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
