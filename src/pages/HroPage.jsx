import { useState, useMemo, useEffect, useCallback } from 'react'
import { categorias, todosOsProcedimentos, alternativas } from '../data/hro-guia'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const ACCENT_DOT = {
  red: 'bg-red-400', rose: 'bg-rose-400', blue: 'bg-blue-500',
  purple: 'bg-purple-500', slate: 'bg-slate-400', amber: 'bg-amber-400',
  yellow: 'bg-yellow-400', green: 'bg-emerald-500', orange: 'bg-orange-400',
  teal: 'bg-teal-500', violet: 'bg-violet-500', cyan: 'bg-cyan-500',
  sky: 'bg-sky-500', pink: 'bg-pink-400', lime: 'bg-lime-500',
}

function CopiarBtn({ code }) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        navigator.clipboard.writeText(code)
        toast.success('Código copiado!', { duration: 1500 })
      }}
      className="rounded p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
      title="Copiar código"
    >
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  )
}

function Stars({ n }) {
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      {[1, 2, 3].map(i => (
        <svg key={i} className={cn('h-3.5 w-3.5', i <= n ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-200')}
          stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </span>
  )
}

function CidChips({ cidText }) {
  const cids = cidText.split(/\s*[\/·]\s*/).map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {cids.map(cid => (
        <span key={cid} title={cid} className="cursor-default rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{cid}</span>
      ))}
    </div>
  )
}

// ── Linha de procedimento (igual ao ProcedureRow do site) ─────────────────────

function ProcRow({ p, selected, catLabel, onClick }) {
  const dot = p.grupo === '03' ? 'bg-emerald-400' : 'bg-orange-400'
  const nameUpper = p.name.toUpperCase()

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <Card className={cn(
        'border-slate-100 bg-white transition-all duration-200',
        'group-hover:shadow-[0_2px_12px_rgba(15,23,42,0.08)] group-hover:border-slate-200',
        selected && 'border-blue-200 bg-blue-50/30 shadow-[0_2px_12px_rgba(15,23,42,0.08)]',
        p.alert && !selected && 'border-red-100',
      )}>
        <CardContent className="flex items-center gap-3 px-4 py-3">
          <div className={cn('self-stretch w-[3px] shrink-0 rounded-sm', dot)} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="font-mono text-xs text-slate-400">{formatCodigo(p.code)}</p>
              <CopiarBtn code={p.code} />
              {catLabel && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{catLabel}</span>
              )}
            </div>
            <p title={nameUpper} className="text-sm font-medium leading-snug text-slate-800">{nameUpper}</p>
            <CidChips cidText={p.cid_text} />
          </div>

          <Stars n={p.priority} />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Painel de detalhe (3ª coluna / Sheet) ─────────────────────────────────────

function ProcDetailPanel({ p }) {
  const [fin, setFin] = useState(null)
  const [loadingFin, setLoadingFin] = useState(true)

  useEffect(() => {
    setFin(null)
    setLoadingFin(true)
    supabase
      .from('procedimentos')
      .select('vl_sa, vl_sh, vl_sp, qt_dias_perman, no_financiamento')
      .eq('co_procedimento', p.code)
      .single()
      .then(({ data }) => {
        setFin(data ?? null)
        setLoadingFin(false)
      })
  }, [p.code])

  const total = fin ? (fin.vl_sa || 0) + (fin.vl_sh || 0) + (fin.vl_sp || 0) : 0
  const dot = p.grupo === '03' ? 'bg-emerald-400' : 'bg-orange-400'

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <div className={cn('h-3 w-[3px] rounded-sm shrink-0', dot)} />
          <p className="font-mono text-xs text-slate-400">{formatCodigo(p.code)}</p>
          <CopiarBtn code={p.code} />
        </div>
        <h2 className="text-sm font-semibold text-slate-800 leading-snug">{p.name.toUpperCase()}</h2>
        <div className="mt-1.5 flex items-center gap-2">
          <Stars n={p.priority} />
          <span className="text-[11px] text-slate-400">{['mensal', 'semanal', 'diário'][p.priority - 1]}</span>
        </div>
      </div>

      {/* Grupo */}
      <div className="rounded-lg border border-slate-100 bg-white px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Grupo SIGTAP</p>
        {p.grupo === '03' ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Grupo 03 — Clínico (preferencial AIH)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            Grupo 04 — Cirúrgico (verificar FPO)
          </span>
        )}
      </div>

      {/* CIDs */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">CIDs compatíveis</p>
        <div className="flex flex-wrap gap-1">
          {p.cid_text.split(/\s*[\/·]\s*/).map(cid => (
            <span key={cid} className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-700">{cid.trim()}</span>
          ))}
        </div>
      </div>

      {/* Obs */}
      {p.obs && (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Observação</p>
          <p className="text-xs text-slate-600 italic">{p.obs}</p>
        </div>
      )}

      {/* Alerta habilitação */}
      {p.alert && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 ring-1 ring-red-100">
          <svg className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-red-700">{p.alert}</p>
        </div>
      )}

      {/* Valores financeiros */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Valores SUS</p>
        {loadingFin ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ) : fin ? (
          <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
            <div className="divide-y divide-slate-50">
              {[
                { label: 'Ambulatorial', val: fin.vl_sa },
                { label: 'Hospitalar', val: fin.vl_sh },
                { label: 'Profissional', val: fin.vl_sp },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between px-3 py-2">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs tabular-nums text-slate-600">{formatBRL(val)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-semibold text-slate-700">Total</span>
              <span className="text-sm font-bold tabular-nums text-emerald-600">{formatBRL(total)}</span>
            </div>
            {fin.qt_dias_perman > 0 && fin.qt_dias_perman < 9999 && (
              <div className="border-t border-slate-100 px-3 py-2">
                <p className="text-[11px] text-slate-400">
                  Permanência mín. <span className="font-semibold text-blue-600">{fin.qt_dias_perman} {fin.qt_dias_perman === 1 ? 'dia' : 'dias'}</span>
                  <span className="ml-1 text-slate-300">· paga a partir de {fin.qt_dias_perman + 1}</span>
                </p>
              </div>
            )}
            {fin.no_financiamento && (
              <div className="border-t border-slate-100 px-3 py-1.5">
                <span className="text-[10px] text-slate-400">{fin.no_financiamento}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Dados financeiros não encontrados.</p>
        )}
      </div>
    </div>
  )
}

// ── Aba 1: Busca rápida ───────────────────────────────────────────────────────

const SUGESTOES = ['IAM', 'AVC', 'sepse', 'TCE', 'fratura fêmur', 'pancreatite', 'overdose', 'eclâmpsia', 'DPOC', 'dengue']

function BuscaTab() {
  const [query, setQuery] = useState('')
  const [sheetProc, setSheetProc] = useState(null)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    return todosOsProcedimentos
      .filter(p =>
        normalize(p.name).includes(q) ||
        normalize(p.code).includes(q) ||
        normalize(p.cid_text).includes(q) ||
        p.keywords.some(k => normalize(k).includes(q))
      )
      .sort((a, b) => b.priority - a.priority)
  }, [query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Diagnóstico, situação clínica, sigla ou código…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {!query && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-6 text-center">
          <p className="text-sm text-slate-500 mb-3">Exemplos de busca:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGESTOES.map(s => (
              <button key={s} onClick={() => setQuery(s)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && results.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 py-12 text-center">
          <p className="text-sm text-slate-400">Nenhum resultado para <strong className="text-slate-600">"{query}"</strong></p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 px-0.5">{results.length} resultado{results.length !== 1 ? 's' : ''} — clique para ver detalhes e valores</p>
          {results.map(p => (
            <ProcRow key={p.code} p={p} catLabel={p.categoria} onClick={() => setSheetProc(p)} />
          ))}
        </div>
      )}

      <Sheet open={!!sheetProc} onOpenChange={open => !open && setSheetProc(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {sheetProc && <ProcDetailPanel p={sheetProc} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ── Aba 2: Por especialidade — layout 3 colunas ───────────────────────────────

function EspecialidadeTab() {
  const [catId, setCatId] = useState(null)
  const [selectedProc, setSelectedProc] = useState(null)
  const [sheetProc, setSheetProc] = useState(null)  // mobile sheet

  const cat = categorias.find(c => c.id === catId)

  const handleSelectCat = useCallback((id) => {
    setCatId(prev => prev === id ? null : id)
    setSelectedProc(null)
  }, [])

  const handleSelectProc = useCallback((p) => {
    setSelectedProc(p)
    // Sheet only on mobile — desktop uses the 3rd column (avoids dark overlay on desktop)
    if (window.innerWidth < 1024) {
      setSheetProc(p)
    }
  }, [])

  const procs = useMemo(() =>
    cat ? [...cat.procedimentos].sort((a, b) => b.priority - a.priority) : [],
    [cat]
  )

  return (
    <>
      {/* Layout 3 colunas */}
      <div className="flex gap-0 -mx-4 sm:-mx-6 border-t border-slate-100" style={{ height: 'calc(100vh - 200px)', minHeight: '480px' }}>

        {/* Coluna 1: Especialidades */}
        <div className="w-48 xl:w-56 shrink-0 overflow-y-auto border-r border-slate-100">
          <div className="py-2">
            {categorias.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelectCat(c.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left transition',
                  catId === c.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <div className={cn('h-3.5 w-[3px] shrink-0 rounded-sm bg-blue-900', catId === c.id && 'bg-blue-600')} />
                <span className={cn('flex-1 text-sm leading-tight', catId === c.id ? 'font-semibold' : 'font-medium')}>{c.nome}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Coluna 2: Procedimentos */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 py-3">
          {!cat ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-400">Selecione uma especialidade.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 mb-2 px-0.5">{cat.nome} · {cat.procedimentos.length} procedimentos · clique para detalhes</p>
              {procs.map(p => (
                <ProcRow
                  key={p.code}
                  p={p}
                  selected={selectedProc?.code === p.code}
                  onClick={() => handleSelectProc(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Coluna 3: Detalhe (desktop lg+) */}
        <div className={cn(
          'shrink-0 overflow-y-auto border-l border-slate-100 px-4 py-4 transition-all hidden lg:block',
          selectedProc ? 'w-72 xl:w-80' : 'w-0 px-0 overflow-hidden'
        )}>
          {selectedProc && <ProcDetailPanel p={selectedProc} />}
        </div>
      </div>

      {/* Mobile: Sheet para detalhe */}
      <Sheet open={!!sheetProc} onOpenChange={open => !open && setSheetProc(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto lg:hidden">
          {sheetProc && <ProcDetailPanel p={sheetProc} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ── Aba 3: Código rejeitado ───────────────────────────────────────────────────

function CodigoRejeitadoTab() {
  const [codigo, setCodigo] = useState('')
  const [sheetProc, setSheetProc] = useState(null)

  const resultado = useMemo(() => {
    const q = codigo.trim().replace(/\D/g, '')
    if (q.length < 4) return null
    return alternativas.find(a => a.naoUsar.replace(/\D/g, '').includes(q)) ?? null
  }, [codigo])

  const procAlternativa = useMemo(() => {
    if (!resultado) return null
    const code = resultado.usarEm.split(' ')[0]
    return todosOsProcedimentos.find(p => p.code === code) ?? null
  }, [resultado])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Digite o código que foi <strong className="text-slate-800">rejeitado na AIH</strong>. O sistema mostra a melhor alternativa do grupo 03 para o HRO.
      </div>

      <input
        value={codigo}
        onChange={e => setCodigo(e.target.value)}
        placeholder="Ex: 0401010104"
        maxLength={15}
        className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 font-mono text-sm shadow-sm placeholder:font-sans placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
      />

      {codigo.trim().length >= 4 && !resultado && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">Código <strong>{codigo.trim()}</strong> não está mapeado.</p>
          <p className="text-xs text-amber-600 mt-0.5">Use a aba "Busca rápida" para encontrar um equivalente do grupo 03.</p>
        </div>
      )}

      {resultado && (
        <div className="space-y-3">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-red-400 mb-1">Não usar</p>
            <p className="font-mono text-sm font-bold text-red-700">{resultado.naoUsar}</p>
            <p className="text-xs text-red-500 mt-0.5">{resultado.motivo}</p>
          </div>

          <div className="flex justify-center">
            <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 mb-1">Usar no lugar</p>
            <p className="font-mono text-sm font-bold text-emerald-700">{resultado.usarEm}</p>
            {resultado.cids && <p className="text-xs text-emerald-600 mt-0.5">CIDs: {resultado.cids}</p>}
          </div>

          {procAlternativa && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Clique para ver detalhes e valores:</p>
              <ProcRow p={procAlternativa} onClick={() => setSheetProc(procAlternativa)} />
            </div>
          )}

          <div className="rounded-lg border border-slate-100 bg-white px-4 py-2.5">
            <p className="text-xs text-slate-400">Situação: <span className="font-medium text-slate-700">{resultado.situacao}</span></p>
          </div>
        </div>
      )}

      <Sheet open={!!sheetProc} onOpenChange={open => !open && setSheetProc(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {sheetProc && <ProcDetailPanel p={sheetProc} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'busca',         label: 'Busca rápida' },
  { id: 'especialidade', label: 'Por especialidade' },
  { id: 'rejeitado',     label: 'Código rejeitado' },
]

export function HroPage() {
  const [tab, setTab] = useState('especialidade')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#0D2347] to-[#0F3460]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-white">Guia de Códigos — PS HRO</h1>
              <p className="mt-0.5 text-sm text-blue-200">
                CNES 2537788 · SIGTAP 202602 · Grupo 03 preferencial
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-blue-300/70 shrink-0">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Gr.03 clínico</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" />Gr.04 verificar FPO</span>
              <span className="text-amber-300/80">★★★ diário · ★★☆ semanal · ★☆☆ mensal</span>
            </div>
          </div>

          <div className="flex gap-1 mt-4 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-xs font-medium transition',
                  tab === t.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-blue-200/70 hover:text-white'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {tab === 'especialidade' ? (
        // Por especialidade: sem padding lateral (colunas chegam até a borda)
        <div className="mx-auto max-w-5xl">
          <EspecialidadeTab />
        </div>
      ) : (
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {tab === 'busca'     && <BuscaTab />}
          {tab === 'rejeitado' && <CodigoRejeitadoTab />}
        </main>
      )}
    </div>
  )
}
