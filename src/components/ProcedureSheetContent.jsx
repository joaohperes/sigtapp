import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo, toSentenceCase } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'
import { useFavoritos } from '../contexts/FavoritosContext'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

// Cache de descrições para evitar re-fetch ao reabrir o sheet
const descCache = new Map()

export function ProcedureSheetContent({ procedure }) {
  const { co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, no_financiamento } = procedure
  const total = (vl_sa || 0) + (vl_sh || 0) + (vl_sp || 0)
  const estilo = GRUPO_MAP[co_procedimento?.slice(0, 2)]
  const { isFavorito, toggleFavorito } = useFavoritos()
  const fav = isFavorito(co_procedimento)

  const [descricao, setDescricao] = useState(() => descCache.get(co_procedimento)?.desc ?? null)
  const [diasPerman, setDiasPerman] = useState(() => descCache.get(co_procedimento)?.dias ?? null)
  const [inSia, setInSia] = useState(() => descCache.get(co_procedimento)?.sia ?? false)
  const [inSih, setInSih] = useState(() => descCache.get(co_procedimento)?.sih ?? false)
  const [habilitacoes, setHabilitacoes] = useState(() => descCache.get(co_procedimento)?.hab ?? [])
  const [compatibilidades, setCompatibilidades] = useState(() => descCache.get(co_procedimento)?.compat ?? [])
  const [descLoading, setDescLoading] = useState(!descCache.has(co_procedimento))

  useEffect(() => {
    if (descCache.has(co_procedimento)) return
    setDescricao(null)
    setDiasPerman(null)
    setHabilitacoes([])
    setDescLoading(true)
    Promise.all([
      supabase
        .from('procedimentos')
        .select('ds_procedimento, qt_dias_perman, in_sia, in_sih')
        .eq('co_procedimento', co_procedimento)
        .single(),
      supabase
        .from('procedimento_habilitacoes')
        .select('co_habilitacao, no_habilitacao')
        .eq('co_procedimento', co_procedimento)
        .order('co_habilitacao'),
      supabase
        .from('procedimento_compatibilidades')
        .select('co_procedimento_compativel, no_procedimento_compativel, qt_permitida')
        .eq('co_procedimento', co_procedimento)
        .order('no_procedimento_compativel'),
    ]).then(([{ data }, { data: habData }, { data: compatData }]) => {
        const desc  = data?.ds_procedimento || null
        const dias  = data?.qt_dias_perman || 0
        const sia   = data?.in_sia || false
        const sih   = data?.in_sih || false
        const hab   = habData ?? []
        const compat = compatData ?? []
        descCache.set(co_procedimento, { desc, dias, sia, sih, hab, compat })
        setDescricao(desc)
        setDiasPerman(dias)
        setInSia(sia)
        setInSih(sih)
        setHabilitacoes(hab)
        setCompatibilidades(compat)
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
            <div className="flex items-center gap-1">
              <p className="font-mono text-xs text-slate-400">{formatCodigo(co_procedimento)}</p>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(co_procedimento); toast.success('Código copiado!', { duration: 1500 }) }}
                className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                title="Copiar código"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
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

      {(inSia || inSih) && (
        <div className="flex gap-1.5">
          {inSia && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">SIA</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-xs">
                  Sistema de Informações Ambulatoriais — procedimento cobrado via BPA (ambulatório)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {inSih && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">SIH</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-xs">
                  Sistema de Informações Hospitalares — procedimento cobrado via AIH (internação)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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

      {habilitacoes.length > 0 && (
        <HabilitacoesSection habilitacoes={habilitacoes} />
      )}

      {compatibilidades.length > 0 && (
        <CompatSection compatibilidades={compatibilidades} />
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
        {diasPerman > 0 && diasPerman < 9999 && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Permanência mínima (AIH)</span>
              <span className="tabular-nums text-sm font-semibold text-blue-700">
                {diasPerman} {diasPerman === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            <p className="mt-0.5 text-right text-xs text-slate-400">
              Pagamento a partir de {diasPerman + 1} dias
            </p>
          </div>
        )}
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

function isProgramaSUS(nome) {
  const n = nome?.toLowerCase() ?? ''
  return n.includes('programa') || n.includes('agora tem') || n.includes('componente acesso')
}

function SheetHabRow({ h }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="shrink-0 font-mono text-xs font-semibold text-teal-600">{h.co_habilitacao}</span>
      <span className="text-sm text-slate-600">{toSentenceCase(h.no_habilitacao)}</span>
    </div>
  )
}

function HabilitacoesSection({ habilitacoes }) {
  const [open, setOpen] = useState(false)
  const reais = habilitacoes.filter(h => !isProgramaSUS(h.no_habilitacao))
  const programas = habilitacoes.filter(h => isProgramaSUS(h.no_habilitacao))
  return (
    <div className="space-y-2">
      {reais.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">Habilitações necessárias</p>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
            {reais.map(h => <SheetHabRow key={h.co_habilitacao} h={h} />)}
          </div>
        </div>
      )}
      {programas.length > 0 && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 overflow-hidden">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left"
          >
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="text-xs font-semibold text-violet-800">Credenciamentos em programas ({programas.length})</span>
            </div>
            <svg
              className={`h-3.5 w-3.5 text-violet-400 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <div className="border-t border-violet-200 bg-white divide-y divide-slate-100">
              {programas.map(h => <SheetHabRow key={h.co_habilitacao} h={h} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CompatSection({ compatibilidades }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-xs font-semibold text-blue-800">Pode cobrar junto com ({compatibilidades.length})</span>
        </div>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-blue-200 bg-white divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {compatibilidades.map((c) => (
            <Link
              key={c.co_procedimento_compativel}
              to={`/procedimento/${c.co_procedimento_compativel}`}
              className="flex items-baseline gap-2 px-3 py-2 hover:bg-blue-50 transition"
            >
              <span className="shrink-0 font-mono text-xs font-semibold text-blue-600">{formatCodigo(c.co_procedimento_compativel)}</span>
              <span className="flex-1 text-sm text-slate-600">{toSentenceCase(c.no_procedimento_compativel)}</span>
              {c.qt_permitida > 0 && (
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">máx {c.qt_permitida}x</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
