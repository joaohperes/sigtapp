import { useState, useMemo } from 'react'
import { categorias, todosOsProcedimentos, alternativas } from '../data/hro-guia'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Stars({ n }) {
  return (
    <span className="flex items-center gap-0.5 shrink-0" title={['mensal', 'semanal', 'diário'][n - 1]}>
      {[1, 2, 3].map(i => (
        <svg key={i} className={cn('h-3 w-3', i <= n ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-200')}
          stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </span>
  )
}

function ProcCard({ p, catLabel }) {
  const dot = p.grupo === '03' ? 'bg-emerald-400' : 'bg-orange-400'

  return (
    <div className="group">
      <Card className={cn(
        'border-slate-100 bg-white transition-all duration-200',
        'group-hover:shadow-[0_2px_12px_rgba(15,23,42,0.08)] group-hover:border-slate-200',
        p.alert && 'border-red-100',
      )}>
        <CardContent className="flex items-start gap-3 px-4 py-3">
          <div className={cn('mt-0.5 w-[3px] shrink-0 self-stretch rounded-sm', dot)} />

          <div className="min-w-0 flex-1">
            {/* Código + badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <button
                onClick={() => { navigator.clipboard.writeText(p.code); toast.success(`Copiado: ${p.code}`, { duration: 1500 }) }}
                className="font-mono text-xs text-slate-400 hover:text-blue-600 transition"
                title="Copiar código"
              >
                {p.code}
              </button>
              {p.grupo === '04' && (
                <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600 ring-1 ring-orange-200">
                  Gr. 04 — verificar FPO
                </span>
              )}
              {catLabel && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{catLabel}</span>
              )}
            </div>

            {/* Nome */}
            <p className="text-sm font-medium leading-snug text-slate-800">{p.name}</p>

            {/* CID */}
            <p className="mt-0.5 text-xs text-slate-400">{p.cid_text}</p>

            {/* Obs */}
            {p.obs && <p className="mt-0.5 text-xs text-slate-500 italic">{p.obs}</p>}

            {/* Alerta habilitação */}
            {p.alert && (
              <div className="mt-2 flex items-start gap-1.5 rounded bg-red-50 px-2.5 py-1.5 ring-1 ring-red-100">
                <svg className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-red-700">{p.alert}</p>
              </div>
            )}
          </div>

          <Stars n={p.priority} />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Aba 1: Busca rápida ───────────────────────────────────────────────────────

const SUGESTOES = ['IAM', 'AVC', 'sepse', 'TCE', 'fratura fêmur', 'pancreatite', 'overdose', 'eclâmpsia', 'DPOC', 'dengue']

function BuscaTab() {
  const [query, setQuery] = useState('')

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
      {/* Campo de busca */}
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

      {/* Estado vazio */}
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

      {/* Sem resultados */}
      {query && results.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 py-12 text-center">
          <p className="text-sm text-slate-400">Nenhum resultado para <strong className="text-slate-600">"{query}"</strong></p>
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 px-0.5">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
          {results.map(p => <ProcCard key={p.code} p={p} catLabel={p.categoria} />)}
        </div>
      )}
    </div>
  )
}

// ── Aba 2: Por especialidade ──────────────────────────────────────────────────

const ACCENT_DOT = {
  red: 'bg-red-400', rose: 'bg-rose-400', blue: 'bg-blue-500',
  purple: 'bg-purple-500', slate: 'bg-slate-400', amber: 'bg-amber-400',
  yellow: 'bg-yellow-400', green: 'bg-emerald-500', orange: 'bg-orange-400',
  teal: 'bg-teal-500', violet: 'bg-violet-500', cyan: 'bg-cyan-500',
  sky: 'bg-sky-500', pink: 'bg-pink-400', lime: 'bg-lime-500',
}

function EspecialidadeTab() {
  const [catId, setCatId] = useState(null)
  const cat = categorias.find(c => c.id === catId)

  return (
    <div className="space-y-3">
      {/* Grid de especialidades */}
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {categorias.map(c => (
          <button
            key={c.id}
            onClick={() => setCatId(catId === c.id ? null : c.id)}
            className={cn(
              'group flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left transition',
              catId === c.id
                ? 'border-blue-200 bg-blue-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            <div className={cn('h-4 w-[3px] shrink-0 rounded-sm', ACCENT_DOT[c.cor] ?? ACCENT_DOT.slate)} />
            <span className="min-w-0 flex-1 text-xs font-medium leading-tight text-slate-700">{c.nome}</span>
            <span className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
              catId === c.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            )}>
              {c.procedimentos.length}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de procedimentos */}
      {!cat && (
        <p className="text-xs text-slate-400 py-1">Selecione uma especialidade.</p>
      )}

      {cat && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 py-1 border-b border-slate-100">
            <div className={cn('h-3.5 w-[3px] shrink-0 rounded-sm', ACCENT_DOT[cat.cor] ?? ACCENT_DOT.slate)} />
            <h3 className="text-sm font-semibold text-slate-700">{cat.nome}</h3>
            <span className="text-[11px] text-slate-400">{cat.procedimentos.length} procedimentos</span>
          </div>
          {[...cat.procedimentos]
            .sort((a, b) => b.priority - a.priority)
            .map(p => <ProcCard key={p.code} p={p} />)}
        </div>
      )}
    </div>
  )
}

// ── Aba 3: Código rejeitado ───────────────────────────────────────────────────

function CodigoRejeitadoTab() {
  const [codigo, setCodigo] = useState('')

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
              <p className="text-xs text-slate-400 mb-2">Detalhes do procedimento:</p>
              <ProcCard p={procAlternativa} />
            </div>
          )}

          <div className="rounded-lg border border-slate-100 bg-white px-4 py-2.5">
            <p className="text-xs text-slate-400">Situação: <span className="font-medium text-slate-700">{resultado.situacao}</span></p>
          </div>
        </div>
      )}
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
  const [tab, setTab] = useState('busca')

  return (
    <div className="min-h-screen bg-background">
      {/* Header — mesmo padrão das outras páginas */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#0D2347] to-[#0F3460]">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-white">Guia de Códigos — PS HRO</h1>
              <p className="mt-0.5 text-sm text-blue-200">
                CNES 2537788 · SIGTAP 202602 · Grupo 03 preferencial
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-blue-300/60 shrink-0">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />Gr.03</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />Gr.04</span>
              <span className="flex items-center gap-1 text-amber-300/70">★★★ diário</span>
            </div>
          </div>

          {/* Tabs */}
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
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {tab === 'busca'         && <BuscaTab />}
        {tab === 'especialidade' && <EspecialidadeTab />}
        {tab === 'rejeitado'     && <CodigoRejeitadoTab />}
      </main>
    </div>
  )
}
