import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

function PriceTooltip({ total, vl_sa, vl_sh, vl_sp, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="left"
        className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs space-y-1 min-w-[160px]"
      >
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Ambulatorial</span>
          <span className="tabular-nums">{formatBRL(vl_sa)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Hospitalar</span>
          <span className="tabular-nums">{formatBRL(vl_sh)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Profissional</span>
          <span className="tabular-nums">{formatBRL(vl_sp)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1">
          <span className="font-semibold text-white">Total</span>
          <span className="tabular-nums font-semibold text-emerald-400">{formatBRL(total)}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function ProcedureCard({ procedure, onSelect }) {
  const { co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, no_financiamento } = procedure
  const total = (vl_sa || 0) + (vl_sh || 0) + (vl_sp || 0)
  const estilo = GRUPO_MAP[co_procedimento?.slice(0, 2)]

  const inner = (
    <Card className="overflow-hidden shadow-sm transition group-hover:shadow-md">
      {estilo && <div className={cn('h-1 w-full', estilo.dot)} />}

      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-slate-400">{formatCodigo(co_procedimento)}</p>
            <p className="mt-1 text-sm font-medium leading-snug text-slate-800 line-clamp-2">
              {no_procedimento}
            </p>
            {no_financiamento && (
              <Badge
                variant="secondary"
                className="mt-2 rounded-full px-2 py-0.5 text-xs font-normal"
              >
                {no_financiamento}
              </Badge>
            )}
          </div>
          <PriceTooltip total={total} vl_sa={vl_sa} vl_sh={vl_sh} vl_sp={vl_sp}>
            <div className="shrink-0 text-right cursor-default">
              <p className="text-xs text-slate-400">Total SUS</p>
              <p className="text-base font-bold text-emerald-600">{formatBRL(total)}</p>
            </div>
          </PriceTooltip>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <ValueCell label="Ambulatorial" value={vl_sa} />
          <ValueCell label="Hospitalar" value={vl_sh} />
          <ValueCell label="Profissional" value={vl_sp} />
        </div>
      </CardContent>
    </Card>
  )

  if (onSelect) {
    return (
      <div
        className="group block cursor-pointer transition hover:-translate-y-0.5"
        onClick={() => onSelect(procedure)}
      >
        {inner}
      </div>
    )
  }

  return (
    <Link
      to={`/procedimento/${co_procedimento}`}
      className="group block transition hover:-translate-y-0.5"
    >
      {inner}
    </Link>
  )
}

export function ProcedureCardSkeleton() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="h-1 w-full bg-slate-200" />
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-1 h-5 w-20 rounded-full" />
          </div>
          <div className="shrink-0 space-y-1.5 text-right">
            <Skeleton className="ml-auto h-3 w-14" />
            <Skeleton className="ml-auto h-5 w-20" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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

export function ProcedureRow({ procedure, onSelect }) {
  const { co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, no_financiamento } = procedure
  const total = (vl_sa || 0) + (vl_sh || 0) + (vl_sp || 0)
  const estilo = GRUPO_MAP[co_procedimento?.slice(0, 2)]

  function handleCopyCodigo(e) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(co_procedimento.replace(/\D/g, ''))
    toast.success('Código copiado!', { duration: 1500 })
  }

  const inner = (
    <Card className="transition shadow-sm group-hover:border-slate-300 group-hover:shadow-md">
      <CardContent className="flex items-center gap-3 px-4 py-3">
        {estilo && (
          <div className={cn('h-8 w-1 shrink-0 rounded-full', estilo.dot)} />
        )}
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
            <Badge
              variant="secondary"
              className="mt-1 rounded-full px-2 py-0.5 text-xs font-normal"
            >
              {no_financiamento}
            </Badge>
          )}
        </div>
        <PriceTooltip total={total} vl_sa={vl_sa} vl_sh={vl_sh} vl_sp={vl_sp}>
          <div className="shrink-0 text-right cursor-default">
            <p className="text-xs text-slate-400">Total SUS</p>
            <p className="text-sm font-bold text-emerald-600">{formatBRL(total)}</p>
          </div>
        </PriceTooltip>
      </CardContent>
    </Card>
  )

  if (onSelect) {
    return (
      <div className="group block cursor-pointer" onClick={() => onSelect(procedure)}>
        {inner}
      </div>
    )
  }

  return (
    <Link to={`/procedimento/${co_procedimento}`} className="group block">
      {inner}
    </Link>
  )
}
