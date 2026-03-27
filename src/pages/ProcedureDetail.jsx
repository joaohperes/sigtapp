import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo, toSentenceCase } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'
import { useFavoritos } from '../contexts/FavoritosContext'
import { useModoUE } from '../contexts/ModoUEContext'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ProcedureDetail() {
  const { codigo } = useParams()
  const [data, setData] = useState(null)
  const [cids, setCids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (data) {
      document.title = `${data.no_procedimento} — SIGTAP`
      return () => { document.title = 'SIGTAP — Tabela de Procedimentos SUS' }
    }
  }, [data])

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
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <Skeleton className="h-4 w-24 bg-blue-700" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-32 bg-blue-700" />
              <Skeleton className="h-7 w-3/4 bg-blue-700" />
              <Skeleton className="h-3 w-28 bg-blue-700" />
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
            <div className="space-y-3">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </main>
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
  const { isFavorito, toggleFavorito } = useFavoritos()
  const { modoUE } = useModoUE()
  const fav = isFavorito(data.co_procedimento)
  const cidsPrincipais = cids.filter((c) => c.st_principal === 'S')
  const cidsSecundarios = cids.filter((c) => c.st_principal !== 'S')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={modoUE ? "bg-gradient-to-br from-red-900 via-red-800 to-red-700" : "bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600"}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs">
            <Link to="/" className={cn("transition", modoUE ? "text-red-300 hover:text-white" : "text-blue-300 hover:text-white")}>
              Busca
            </Link>
            {data.co_grupo && (
              <>
                <span className={modoUE ? "text-red-600" : "text-blue-600"}>/</span>
                <Link
                  to={`/grupo/${data.co_grupo}`}
                  className={cn("transition", modoUE ? "text-red-300 hover:text-white" : "text-blue-300 hover:text-white")}
                >
                  {data.no_grupo}
                </Link>
              </>
            )}
          </nav>

          <div className="mt-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1">
                  <p className={cn("font-mono text-xs", modoUE ? "text-red-300" : "text-blue-300")}>{formatCodigo(data.co_procedimento)}</p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(data.co_procedimento); toast.success('Código copiado!', { duration: 1500 }) }}
                    className="rounded p-0.5 text-white/40 transition hover:text-white/80"
                    title="Copiar código"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <h1 className="mt-0.5 text-xl font-bold leading-snug text-white">
                  {data.no_procedimento}
                </h1>
              </div>
              <button
                onClick={() => toggleFavorito(data)}
                className="mt-1 shrink-0 rounded-xl bg-white/10 p-2.5 transition hover:bg-white/20"
                title={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <svg
                  className={cn('h-5 w-5 transition', fav ? 'fill-amber-400 text-amber-400' : 'fill-none text-white')}
                  stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            </div>
            {data.dt_competencia && (
              <p className={cn("mt-1.5 text-xs", modoUE ? "text-red-300" : "text-blue-300")}>
                Competência {data.dt_competencia.slice(0, 4)}/{data.dt_competencia.slice(4)}
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">

          {/* Coluna esquerda — Valores */}
          <div className="space-y-3">
            <ValueCard label="Ambulatorial (SA)" value={data.vl_sa} />
            <ValueCard label="Hospitalar (SH)" value={data.vl_sh} />
            <ValueCard label="Profissional (SP)" value={data.vl_sp} />
            <ValueCard label="Total SUS" value={total} highlight />
            {data.qt_dias_perman > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                <p className="text-xs text-blue-600">Permanência mínima (AIH)</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-blue-800">
                  {data.qt_dias_perman} {data.qt_dias_perman === 1 ? 'dia' : 'dias'}
                </p>
                <p className="mt-1 text-xs text-blue-500">
                  Pagamento a partir de {data.qt_dias_perman + 1} dias
                </p>
              </div>
            )}
          </div>

          {/* Coluna central — Classificação + Descrição */}
          <div className="space-y-4">
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

            {data.ds_procedimento && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Descrição
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">{toSentenceCase(data.ds_procedimento)}</p>
              </div>
            )}
          </div>

          {/* Coluna direita — CIDs relacionados */}
          {cids.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  CIDs relacionados
                </h2>
                <span className="text-xs text-slate-400">{cids.length} código{cids.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="max-h-[70vh] overflow-y-auto space-y-4">
                {cidsPrincipais.length > 0 && (
                  <div>
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
            </div>
          )}

        </div>
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
    <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-2">
      <dt className="shrink-0 text-slate-400 sm:w-44">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  )
}
