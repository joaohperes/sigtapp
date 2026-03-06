import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo, toSentenceCase } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'
import { useFavoritos } from '../contexts/FavoritosContext'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function StarIcon({ filled }) {
  return (
    <svg
      className={cn('h-5 w-5 transition', filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-400')}
      stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

export function ProcedureSheetContent({ procedure }) {
  const { co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, no_financiamento } = procedure
  const total = (vl_sa || 0) + (vl_sh || 0) + (vl_sp || 0)
  const estilo = GRUPO_MAP[co_procedimento?.slice(0, 2)]
  const { isFavorito, toggleFavorito } = useFavoritos()
  const fav = isFavorito(co_procedimento)

  const [descricao, setDescricao] = useState(null)
  const [descLoading, setDescLoading] = useState(true)

  useEffect(() => {
    setDescricao(null)
    setDescLoading(true)
    supabase
      .from('procedimentos')
      .select('ds_procedimento')
      .eq('co_procedimento', co_procedimento)
      .single()
      .then(({ data }) => {
        setDescricao(data?.ds_procedimento || null)
        setDescLoading(false)
      })
  }, [co_procedimento])

  return (
    <div className="flex flex-col gap-5 pt-2">
      <SheetHeader>
        <div className="flex items-start gap-3">
          {estilo && (
            <div className={cn('mt-1 h-10 w-1.5 shrink-0 rounded-full', estilo.dot)} />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-slate-400">{formatCodigo(co_procedimento)}</p>
            <SheetTitle className="mt-1 text-left text-base font-semibold leading-snug text-slate-800">
              {no_procedimento}
            </SheetTitle>
            {no_financiamento && (
              <Badge variant="secondary" className="mt-2 rounded-full px-2 py-0.5 text-xs font-normal">
                {no_financiamento}
              </Badge>
            )}
          </div>
          <button
            onClick={() => toggleFavorito(procedure)}
            className="shrink-0 rounded-lg p-1.5 transition hover:bg-slate-100"
            title={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <StarIcon filled={fav} />
          </button>
        </div>
      </SheetHeader>

      {estilo && (
        <div className={cn('rounded-lg px-3 py-2 text-xs font-medium', estilo.bg, estilo.text)}>
          {estilo.no}
        </div>
      )}

      {(descLoading || descricao) && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">Descrição</p>
          {descLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/6" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-slate-600">{toSentenceCase(descricao)}</p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-medium text-slate-400">Valores SUS</p>
        <div className="space-y-2">
          {[
            { label: 'Ambulatorial (SA)', value: vl_sa },
            { label: 'Hospitalar (SH)', value: vl_sh },
            { label: 'Profissional (SP)', value: vl_sp },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="tabular-nums text-sm text-slate-700">{formatBRL(value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="tabular-nums text-base font-bold text-emerald-600">{formatBRL(total)}</span>
          </div>
        </div>
      </div>

      <Link
        to={`/procedimento/${co_procedimento}`}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5
                   text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Ver página completa
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}
