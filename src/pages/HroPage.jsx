import { useState, useMemo } from 'react'
import { categorias, todosOsProcedimentos, alternativas } from '../data/hro-guia'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function Stars({ n }) {
  return (
    <span className="text-amber-400 text-xs" title={['mensal', 'semanal', 'diário'][n - 1]}>
      {'★'.repeat(n)}{'☆'.repeat(3 - n)}
    </span>
  )
}

function GrupoBadge({ grupo }) {
  return grupo === '03'
    ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Gr. 03</span>
    : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Gr. 04</span>
}

function CopyButton({ text }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); toast.success(`Copiado: ${text}`) }}
      title="Copiar código"
      className="rounded px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
    >
      {text}
    </button>
  )
}

// ── Card de procedimento ──────────────────────────────────────────────────────

function ProcCard({ p, highlight }) {
  return (
    <div className={cn(
      'rounded-xl border p-3 transition',
      p.alert
        ? 'border-red-200 bg-red-50/60'
        : p.grupo === '04'
          ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
          : 'border-slate-200 bg-white hover:bg-slate-50'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Linha 1: código + badges + stars */}
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <CopyButton text={p.code} />
            <GrupoBadge grupo={p.grupo} />
            <Stars n={p.priority} />
            {highlight && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {p.categoria}
              </span>
            )}
          </div>
          {/* Linha 2: nome */}
          <p className="text-sm font-medium text-slate-800 leading-snug">{p.name}</p>
          {/* Linha 3: CIDs */}
          <p className="mt-0.5 text-xs text-slate-500 leading-snug">{p.cid_text}</p>
          {/* Obs */}
          {p.obs && (
            <p className="mt-1 text-xs text-slate-600 italic">{p.obs}</p>
          )}
        </div>
      </div>
      {/* Alerta de habilitação */}
      {p.alert && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-100 px-2.5 py-1.5">
          <span className="text-red-500 text-xs mt-0.5">⚠</span>
          <p className="text-xs text-red-700 font-medium">{p.alert}</p>
        </div>
      )}
    </div>
  )
}

// ── Aba 1: Busca rápida ───────────────────────────────────────────────────────

function BuscaTab() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    return todosOsProcedimentos.filter(p =>
      normalize(p.name).includes(q) ||
      normalize(p.code).includes(q) ||
      normalize(p.cid_text).includes(q) ||
      p.keywords.some(k => normalize(k).includes(q))
    ).sort((a, b) => b.priority - a.priority)
  }, [query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ex: AVC, fratura fêmur, sepse, pancreatite…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {!query && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-500">Digite uma situação clínica, diagnóstico, sigla ou código.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {['IAM', 'AVC', 'sepse', 'TCE', 'fratura fêmur', 'pancreatite', 'overdose', 'eclâmpsia'].map(s => (
              <button key={s} onClick={() => setQuery(s)}
                className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && results.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-8">Nenhum resultado para "<strong>{query}</strong>"</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
          {results.map(p => <ProcCard key={p.code} p={p} highlight />)}
        </div>
      )}
    </div>
  )
}

// ── Aba 2: Por especialidade ──────────────────────────────────────────────────

const COR_MAP = {
  red: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700',
  rose: 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700',
  blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
  purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
  slate: 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700',
  amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700',
  yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-700',
  green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
  orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700',
  teal: 'bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-700',
  violet: 'bg-violet-50 border-violet-200 hover:bg-violet-100 text-violet-700',
  cyan: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-700',
  sky: 'bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-700',
  pink: 'bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-700',
  lime: 'bg-lime-50 border-lime-200 hover:bg-lime-100 text-lime-700',
}

function EspecialidadeTab() {
  const [catId, setCatId] = useState(null)
  const cat = categorias.find(c => c.id === catId)

  return (
    <div className="space-y-4">
      {/* Grid de categorias */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {categorias.map(c => (
          <button
            key={c.id}
            onClick={() => setCatId(catId === c.id ? null : c.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition',
              catId === c.id
                ? 'ring-2 ring-blue-400 ring-offset-1 ' + (COR_MAP[c.cor] || COR_MAP.slate)
                : (COR_MAP[c.cor] || COR_MAP.slate)
            )}
          >
            <span className="text-base">{c.icone}</span>
            <span className="leading-tight text-xs">{c.nome}</span>
            <span className="ml-auto text-[10px] opacity-60">{c.procedimentos.length}</span>
          </button>
        ))}
      </div>

      {/* Lista da categoria selecionada */}
      {cat && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cat.icone}</span>
            <h3 className="font-semibold text-slate-700">{cat.nome}</h3>
            <span className="text-xs text-slate-400">{cat.procedimentos.length} procedimentos</span>
          </div>
          {cat.procedimentos
            .sort((a, b) => b.priority - a.priority)
            .map(p => <ProcCard key={p.code} p={p} />)}
        </div>
      )}

      {!cat && (
        <p className="text-center text-sm text-slate-400 py-4">Selecione uma especialidade acima.</p>
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
    return alternativas.find(a =>
      a.naoUsar.replace(/\D/g, '').includes(q) ||
      q.includes(a.naoUsar.replace(/\D/g, ''))
    ) || null
  }, [codigo])

  const procAlternativa = useMemo(() => {
    if (!resultado) return null
    const code = resultado.usarEm.split(' ')[0]
    return todosOsProcedimentos.find(p => p.code === code) || null
  }, [resultado])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
        Digite o código que foi <strong>rejeitado</strong> na AIH. O sistema mostra a melhor alternativa do grupo 03.
      </div>

      <div className="relative">
        <input
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          placeholder="Ex: 0401010104"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-4 font-mono text-sm shadow-sm placeholder:font-sans placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          maxLength={15}
        />
      </div>

      {codigo.trim().length >= 4 && !resultado && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Código <strong>{codigo.trim()}</strong> não está mapeado na tabela de alternativas.
          <br /><span className="text-xs text-amber-600 mt-1 block">Tente a busca rápida para encontrar um código do grupo 03 equivalente.</span>
        </div>
      )}

      {resultado && (
        <div className="space-y-3">
          {/* Código rejeitado */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Não usar</p>
            <p className="font-mono text-sm font-bold text-red-700">{resultado.naoUsar}</p>
            <p className="text-xs text-red-600 mt-0.5">{resultado.motivo}</p>
          </div>

          {/* Seta */}
          <div className="flex items-center justify-center text-slate-400 text-lg">↓</div>

          {/* Alternativa */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Usar no lugar</p>
            <p className="font-mono text-sm font-bold text-emerald-700">{resultado.usarEm}</p>
            {resultado.cids && (
              <p className="text-xs text-emerald-700 mt-0.5">CIDs: {resultado.cids}</p>
            )}
          </div>

          {/* Card do procedimento alternativo, se encontrado */}
          {procAlternativa && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Detalhes do procedimento alternativo:</p>
              <ProcCard p={procAlternativa} />
            </div>
          )}

          {/* Situação clínica */}
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <p className="text-xs text-slate-500">Situação: <span className="text-slate-700 font-medium">{resultado.situacao}</span></p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'busca', label: '🔍 Busca rápida' },
  { id: 'especialidade', label: '📋 Por especialidade' },
  { id: 'rejeitado', label: '🔄 Código rejeitado' },
]

export function HroPage() {
  const [tab, setTab] = useState('busca')

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-bold text-white tracking-wide">HRO</span>
          <h1 className="text-xl font-bold text-slate-800">Guia de Códigos — PS</h1>
        </div>
        <p className="text-sm text-slate-500">
          Hospital Regional do Oeste · CNES 2537788 · SIGTAP 202602
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />Grupo 03 = clínico (preferir)</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Grupo 04 = cirúrgico (verificar FPO)</span>
          <span className="flex items-center gap-1"><span className="text-red-500">⚠</span>Alerta de habilitação</span>
          <span className="flex items-center gap-1 text-amber-500">★★★ diário · ★★☆ semanal · ★☆☆ mensal</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 rounded-lg py-2 text-xs font-medium transition',
              tab === t.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {tab === 'busca' && <BuscaTab />}
      {tab === 'especialidade' && <EspecialidadeTab />}
      {tab === 'rejeitado' && <CodigoRejeitadoTab />}
    </div>
  )
}
