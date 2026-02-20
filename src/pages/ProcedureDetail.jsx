import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo, toSentenceCase } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'

export function ProcedureDetail() {
  const { codigo } = useParams()
  const [data, setData] = useState(null)
  const [cids, setCids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase
        .from('procedimentos')
        .select('*')
        .eq('co_procedimento', codigo)
        .single(),
      supabase.rpc('cids_do_procedimento', { p_co: codigo }),
    ]).then(([{ data: row, error: err }, { data: cidData }]) => {
      if (err) setError(err.message)
      else setData(row)
      setCids(cidData ?? [])
      setLoading(false)
    })
  }, [codigo])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400 text-sm">
        Carregando...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">Procedimento não encontrado.</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">← Voltar</Link>
      </div>
    )
  }

  const total = (data.vl_sa || 0) + (data.vl_sh || 0) + (data.vl_sp || 0)
  const estilo = GRUPO_MAP[data.co_grupo]
  const cidsPrincipais = cids.filter((c) => c.st_principal === 'S')
  const cidsSecundarios = cids.filter((c) => c.st_principal !== 'S')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link
            to={data.co_grupo ? `/grupo/${data.co_grupo}` : '/'}
            className="text-sm text-blue-300 hover:text-white transition"
          >
            ← {data.no_grupo ?? 'Voltar'}
          </Link>

          <div className="mt-4">
            <p className="font-mono text-sm text-blue-300">{formatCodigo(data.co_procedimento)}</p>
            <h1 className="mt-1 text-2xl font-bold leading-snug text-white">
              {data.no_procedimento}
            </h1>
            {data.dt_competencia && (
              <p className="mt-2 text-xs text-blue-300">
                Competência {data.dt_competencia.slice(0, 4)}/{data.dt_competencia.slice(4)}
              </p>
            )}
            {estilo && (
              <span className="mt-3 inline-block rounded-full border border-white/20 bg-white/15
                               px-3 py-1 text-xs font-medium text-white/90">
                {data.no_grupo}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        {/* Valores */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ValueCard label="Ambulatorial (SA)" value={data.vl_sa} />
          <ValueCard label="Hospitalar (SH)" value={data.vl_sh} />
          <ValueCard label="Profissional (SP)" value={data.vl_sp} />
          <ValueCard label="Total SUS" value={total} highlight />
        </div>

        {/* Descrição */}
        {data.ds_procedimento && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Descrição
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">{toSentenceCase(data.ds_procedimento)}</p>
          </div>
        )}

        {/* CIDs relacionados */}
        {cids.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                CIDs relacionados
              </h2>
              <span className="text-xs text-slate-400">{cids.length} código{cids.length !== 1 ? 's' : ''}</span>
            </div>

            {cidsPrincipais.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-slate-400">Principais</p>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {cidsPrincipais.map((c) => (
                    <CidRow key={c.co_cid} cid={c} principal />
                  ))}
                </div>
              </div>
            )}

            {cidsSecundarios.length > 0 && (
              <div>
                {cidsPrincipais.length > 0 && (
                  <p className="mb-2 text-xs font-medium text-slate-400">Secundários</p>
                )}
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {cidsSecundarios.map((c) => (
                    <CidRow key={c.co_cid} cid={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Classificação */}
        {(data.no_grupo || data.no_subgrupo || data.no_forma_org) && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Classificação
            </h2>
            <dl className="space-y-2">
              {data.no_grupo && (
                <Row label="Grupo" value={`${data.co_grupo} — ${data.no_grupo}`} />
              )}
              {data.no_subgrupo && (
                <Row label="Subgrupo" value={`${data.co_subgrupo} — ${data.no_subgrupo}`} />
              )}
              {data.no_forma_org && (
                <Row label="Forma de Organização" value={`${data.co_forma_org} — ${data.no_forma_org}`} />
              )}
              {data.no_financiamento && (
                <Row label="Financiamento" value={`${data.tp_financiamento} — ${data.no_financiamento}`} />
              )}
            </dl>
          </div>
        )}
      </main>
    </div>
  )
}

function ValueCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${
      highlight
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-slate-200 bg-white'
    }`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${
        highlight ? 'text-emerald-700' : 'text-slate-800'
      }`}>
        {formatBRL(value)}
      </p>
    </div>
  )
}

function CidRow({ cid, principal }) {
  return (
    <div className="flex items-baseline gap-3 px-3 py-2">
      <span className={`shrink-0 font-mono text-xs font-semibold ${
        principal ? 'text-blue-600' : 'text-slate-500'
      }`}>
        {cid.co_cid.trim()}
      </span>
      <span className="text-sm text-slate-700">{cid.no_cid}</span>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-44 shrink-0 text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  )
}
