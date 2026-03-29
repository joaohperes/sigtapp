import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'
import { expandirSinonimos } from '../data/sinonimos'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

function totalOf(p) {
  return (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
}

function ProcSearchInput({ onAdd, existingCodes }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  async function doSearch(q) {
    const raw = q.trim().replace(/[.\-]/g, '')
    if (raw.length < 2) { setResults([]); setOpen(false); return }

    setLoading(true)
    const isNumeric = /^\d+$/.test(raw)
    let data

    if (isNumeric) {
      const { data: d } = await supabase
        .from('procedimentos')
        .select('co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, tp_financiamento, no_financiamento')
        .ilike('co_procedimento', `${raw}%`)
        .limit(15)
      data = d
    } else {
      const { expanded } = expandirSinonimos(raw)
      const { data: d } = await supabase.rpc('buscar_procedimentos', { query: expanded, limite: 15 })
      data = d
    }

    setResults(data ?? [])
    setOpen(true)
    setLoading(false)
  }

  function handleChange(e) {
    const v = e.target.value
    setQuery(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 350)
  }

  function handleSelect(proc) {
    onAdd(proc)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
          {loading ? (
            <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          onKeyDown={e => e.key === 'Escape' && setOpen(false)}
          placeholder="Buscar procedimento por nome ou código..."
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm
                     shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none
                     focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto
                        rounded-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.14)] ring-1 ring-black/5">
          {results.map((proc) => {
            const estilo = GRUPO_MAP[proc.co_procedimento?.slice(0, 2)]
            const alreadyAdded = existingCodes.has(proc.co_procedimento)
            return (
              <button
                key={proc.co_procedimento}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => !alreadyAdded && handleSelect(proc)}
                disabled={alreadyAdded}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left transition first:pt-3 last:pb-3',
                  alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50',
                )}
              >
                {estilo && <div className={`h-6 w-1 shrink-0 rounded-full ${estilo.dot}`} />}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] text-slate-400">{formatCodigo(proc.co_procedimento)}</p>
                  <p className="truncate text-sm font-medium text-slate-800">{proc.no_procedimento}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-emerald-600">
                  {formatBRL(totalOf(proc))}
                </span>
                {alreadyAdded && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                    já adicionado
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DragHandle() {
  return (
    <svg className="h-4 w-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export function CalculadoraPage() {
  // items: { procedure, qty } — o primeiro é sempre o principal
  const [items, setItems] = useState([])
  const [compatList, setCompatList] = useState(null)
  const [compatLoading, setCompatLoading] = useState(false)
  const [showAllCompat, setShowAllCompat] = useState(false)

  // Drag state
  const dragIndexRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  // O item na posição 0 é sempre o principal
  const principalCo = items[0]?.procedure.co_procedimento
  const existingCodes = new Set(items.map(i => i.procedure.co_procedimento))

  const compatMap = compatList
    ? new Map(compatList.map(r => [r.co_procedimento_compativel, r.qt_permitida]))
    : null
  const compatEmpty = compatList !== null && compatList.length === 0

  useEffect(() => {
    if (!principalCo) { setCompatList(null); setShowAllCompat(false); return }
    setCompatLoading(true)
    supabase
      .from('procedimento_compatibilidades')
      .select('co_procedimento_compativel, no_procedimento_compativel, qt_permitida')
      .eq('co_procedimento', principalCo)
      .order('no_procedimento_compativel')
      .then(({ data }) => {
        setCompatList(data ?? [])
        setCompatLoading(false)
      })
  }, [principalCo])

  async function addByCode(co) {
    const { data } = await supabase
      .from('procedimentos')
      .select('co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, tp_financiamento, no_financiamento')
      .eq('co_procedimento', co)
      .single()
    if (data) addProcedure(data)
  }

  function addProcedure(proc) {
    setItems(prev => [...prev, { procedure: proc, qty: 1 }])
  }

  function removeItem(co) {
    setItems(prev => prev.filter(i => i.procedure.co_procedimento !== co))
  }

  function setQty(co, qty) {
    if (qty < 1 || qty > 99) return
    setItems(prev => prev.map(i =>
      i.procedure.co_procedimento === co ? { ...i, qty } : i
    ))
  }

  function clearAll() {
    setItems([])
    setCompatList(null)
  }

  // Drag-and-drop handlers
  function handleDragStart(e, index) {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    // Pequeno delay para aplicar o estilo "fantasma" após o drag começar
    setTimeout(() => e.target.classList.add('opacity-40'), 0)
  }

  function handleDragEnd(e) {
    e.target.classList.remove('opacity-40')
    dragIndexRef.current = null
    setHoverIndex(null)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setHoverIndex(index)
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex === null || fromIndex === dropIndex) {
      setHoverIndex(null)
      return
    }
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    setHoverIndex(null)
  }

  // Totais
  const totalSA = items.reduce((s, i) => s + (i.procedure.vl_sa || 0) * i.qty, 0)
  const totalSH = items.reduce((s, i) => s + (i.procedure.vl_sh || 0) * i.qty, 0)
  const totalSP = items.reduce((s, i) => s + (i.procedure.vl_sp || 0) * i.qty, 0)
  const totalGeral = totalSA + totalSH + totalSP

  function getCompatWarning(co, qty, isPrincipal) {
    if (isPrincipal || !compatMap || compatEmpty) return null
    if (!compatMap.has(co)) return 'Não listado na tabela de compatibilidades do SIGTAP — o SIGTAP só registra quais combinações são permitidas, sem indicar o motivo das demais.'
    const qtMax = compatMap.get(co)
    if (qtMax && qty > qtMax) return `Quantidade excede o limite do SIGTAP: máximo ${qtMax}× para este procedimento`
    return null
  }

  const compatSuggestions = compatList
    ? compatList.filter(c => !existingCodes.has(c.co_procedimento_compativel))
    : []
  const visibleSuggestions = showAllCompat ? compatSuggestions : compatSuggestions.slice(0, 5)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-[#0A1628] bg-gradient-to-br from-[#0A1628] via-[#0D2347] to-[#0F3460]">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-blue-300/70 hover:text-blue-200 transition">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-white">Calculadora de AIH</h1>
            <p className="mt-1 text-sm text-blue-300/70">
              Monte um conjunto de procedimentos e calcule o valor total faturável pelo SUS.
            </p>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
          {/* Coluna principal */}
          <div className="space-y-4">
            {/* Campo de busca */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-slate-700">Adicionar procedimento</p>
              <ProcSearchInput onAdd={addProcedure} existingCodes={existingCodes} />
              {items.length === 0 && (
                <p className="mt-3 text-xs text-slate-400">
                  O primeiro procedimento adicionado será o <strong>procedimento principal</strong>. Arraste os cards para reordenar.
                </p>
              )}
            </div>

            {/* Lista de procedimentos */}
            {items.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1 pb-1">
                  <p className="text-sm font-semibold text-slate-700">
                    {items.length} procedimento{items.length !== 1 ? 's' : ''}
                    {items.length > 1 && (
                      <span className="ml-2 text-xs font-normal text-slate-400">— arraste para reordenar</span>
                    )}
                  </p>
                  <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-500 transition">
                    Limpar tudo
                  </button>
                </div>

                {items.map((item, index) => {
                  const { procedure: proc, qty } = item
                  const isPrincipal = index === 0
                  const estilo = GRUPO_MAP[proc.co_procedimento?.slice(0, 2)]
                  const warning = getCompatWarning(proc.co_procedimento, qty, isPrincipal)
                  const isCompat = compatMap && !isPrincipal && compatMap.has(proc.co_procedimento)
                  const total = totalOf(proc) * qty
                  const isDragTarget = hoverIndex === index && dragIndexRef.current !== index

                  return (
                    <div key={proc.co_procedimento}>
                      {/* Linha indicadora de drop */}
                      {isDragTarget && dragIndexRef.current > index && (
                        <div className="mx-2 h-0.5 rounded-full bg-blue-400 mb-1" />
                      )}

                      <div
                        draggable
                        onDragStart={e => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => handleDragOver(e, index)}
                        onDrop={e => handleDrop(e, index)}
                        className={cn(
                          'rounded-xl border bg-white shadow-sm transition-all duration-150',
                          isPrincipal
                            ? 'border-blue-300 ring-1 ring-blue-200'
                            : warning
                              ? 'border-amber-200'
                              : 'border-slate-200',
                          isDragTarget && 'ring-2 ring-blue-300 ring-offset-1',
                        )}
                      >
                        {estilo && <div className={`h-1 w-full rounded-t-xl ${estilo.dot}`} />}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Drag handle */}
                            <div className="mt-1 cursor-grab active:cursor-grabbing shrink-0 select-none">
                              <DragHandle />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] text-slate-400">
                                  {formatCodigo(proc.co_procedimento)}
                                </span>
                                {isPrincipal && (
                                  <Badge className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100">
                                    Principal
                                  </Badge>
                                )}
                                {proc.no_financiamento && (
                                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-normal">
                                    {proc.no_financiamento}
                                  </Badge>
                                )}
                              </div>
                              <Link
                                to={`/procedimento/${proc.co_procedimento}`}
                                className="mt-1 block text-sm font-semibold text-slate-900 hover:text-blue-600 transition"
                              >
                                {proc.no_procedimento}
                              </Link>

                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                                {proc.vl_sa > 0 && <span>Amb: <strong className="text-slate-700">{formatBRL(proc.vl_sa)}</strong></span>}
                                {proc.vl_sh > 0 && <span>Hosp: <strong className="text-slate-700">{formatBRL(proc.vl_sh)}</strong></span>}
                                {proc.vl_sp > 0 && <span>Prof: <strong className="text-slate-700">{formatBRL(proc.vl_sp)}</strong></span>}
                              </div>

                              {warning && (
                                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5">
                                  <WarningIcon />
                                  <p className="text-xs text-amber-700">{warning}</p>
                                </div>
                              )}
                              {isCompat && !warning && (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <CheckIcon />
                                  <p className="text-xs text-emerald-600">Compatível com o procedimento principal</p>
                                </div>
                              )}
                            </div>

                            {/* Controles direita */}
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <div className="text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
                                <p className="text-base font-bold text-emerald-600">{formatBRL(total)}</p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setQty(proc.co_procedimento, qty - 1)}
                                  disabled={qty <= 1}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200
                                             text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums text-slate-800">{qty}</span>
                                <button
                                  onClick={() => setQty(proc.co_procedimento, qty + 1)}
                                  disabled={qty >= 99}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200
                                             text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                  </svg>
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(proc.co_procedimento)}
                                className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                title="Remover"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isDragTarget && dragIndexRef.current < index && (
                        <div className="mx-2 h-0.5 rounded-full bg-blue-400 mt-1" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {items.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-sm text-slate-400">Nenhum procedimento adicionado ainda.</p>
                <p className="mt-1 text-xs text-slate-300">Use o campo acima para buscar e adicionar procedimentos.</p>
              </div>
            )}
          </div>

          {/* Painel lateral */}
          <div className="mt-4 lg:mt-0">
            <div className="sticky top-[72px] space-y-3">

              {/* Resumo financeiro */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-sm font-bold text-slate-800">Resumo do faturamento</h2>
                </div>
                <div className="p-5 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Ambulatorial (SA)</span>
                      <span className="font-semibold tabular-nums text-slate-800">{formatBRL(totalSA)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Hospitalar (SH)</span>
                      <span className="font-semibold tabular-nums text-slate-800">{formatBRL(totalSH)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Profissional (SP)</span>
                      <span className="font-semibold tabular-nums text-slate-800">{formatBRL(totalSP)}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Total SUS</span>
                      <span className="text-xl font-bold tabular-nums text-emerald-600">{formatBRL(totalGeral)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {items.reduce((s, i) => s + i.qty, 0)} procedimento{items.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''} · {items.length} tipo{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {compatLoading && (
                    <p className="text-xs text-slate-400">Verificando compatibilidades…</p>
                  )}
                  {!compatLoading && compatEmpty && items.length > 1 && (
                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                      O procedimento principal não possui compatibilidades cadastradas no SIGTAP.
                    </div>
                  )}
                  {!compatLoading && compatMap && !compatEmpty && items.length > 1 && items.slice(1).some(i => !compatMap.has(i.procedure.co_procedimento)) && (
                    <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                      <strong>Atenção:</strong> um ou mais procedimentos não constam na tabela de compatibilidades do SIGTAP para o procedimento principal. O SIGTAP não fornece o motivo — apenas lista as combinações permitidas.
                    </div>
                  )}
                  {!compatLoading && compatMap && !compatEmpty && items.length > 1 && items.slice(1).every(i => compatMap.has(i.procedure.co_procedimento)) && (
                    <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
                      Todos os procedimentos são compatíveis entre si.
                    </div>
                  )}
                </div>
              </div>

              {/* Sugestões de compatíveis */}
              {!compatLoading && compatSuggestions.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-3">
                    <h2 className="text-sm font-bold text-slate-800">Compatíveis com o principal</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {compatSuggestions.length} ainda não adicionado{compatSuggestions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {visibleSuggestions.map((c) => {
                      const estilo = GRUPO_MAP[c.co_procedimento_compativel?.slice(0, 2)]
                      return (
                        <div key={c.co_procedimento_compativel} className="flex items-center gap-2 px-4 py-2.5">
                          {estilo && <div className={`h-5 w-1 shrink-0 rounded-full ${estilo.dot}`} />}
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-[10px] text-slate-400">{formatCodigo(c.co_procedimento_compativel)}</p>
                            <p className="truncate text-xs font-medium text-slate-700">{c.no_procedimento_compativel}</p>
                            {c.qt_permitida > 0 && (
                              <p className="text-[10px] text-slate-400">máx. {c.qt_permitida}×</p>
                            )}
                          </div>
                          <button
                            onClick={() => addByCode(c.co_procedimento_compativel)}
                            className="shrink-0 rounded-lg border border-slate-200 p-1 text-slate-400
                                       transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            title="Adicionar"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  {compatSuggestions.length > 5 && (
                    <div className="border-t border-slate-50 px-4 py-2.5">
                      <button
                        onClick={() => setShowAllCompat(v => !v)}
                        className="text-xs text-blue-600 hover:text-blue-700 transition"
                      >
                        {showAllCompat ? 'Ver menos' : `Ver mais ${compatSuggestions.length - 5} procedimentos`}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
