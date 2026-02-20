import { useNavigate } from 'react-router-dom'
import { formatBRL, formatCodigo } from '../utils/formatters'

export function ProcedureTable({ results }) {
  const navigate = useNavigate()
  if (!results.length) return null

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left">
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
            return (
              <tr
                key={p.co_procedimento}
                onClick={() => navigate(`/procedimento/${p.co_procedimento}`)}
                className="cursor-pointer hover:bg-blue-50/50 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-xs text-blue-600">
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
  )
}
