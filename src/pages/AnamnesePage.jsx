import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { ProcedureRow } from '../components/ProcedureCard'
import { ProcedureSheetContent } from '../components/ProcedureSheetContent'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const EXEMPLO = `Paciente masculino, 58 anos, hipertenso e diabético tipo 2. Queixa de dor torácica opressiva com irradiação para o membro superior esquerdo iniciada há 2 horas, associada a sudorese fria, náuseas e dispneia. Pressão arterial 160/100 mmHg, FC 98 bpm. ECG com supradesnivelamento de ST em V1-V4.`

const STOPWORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'e', 'ou', 'um', 'uma', 'para', 'com', 'por', 'a', 'o', 'as', 'os', 'ao', 'aos'])

// Palavras genéricas demais para o FTS do SIGTAP — removê-las da query melhora o ranking
const FTS_GENERICO = new Set(['tratamento', 'procedimento', 'realizacao', 'realizacao'])

// Qualificadores que disqualificam um resultado quando NÃO estão no termo buscado
// Ex: buscar "cateterismo cardiaco" NÃO deve retornar "CATETERISMO CARDIACO EM PEDIATRIA"
const QUALIF_BLOQUEIO = [
  // Faixa etária
  'PEDIATRIA', 'PEDIATRICO', 'PEDIATRICA', 'NEONATAL', 'RECEM-NASCIDO', 'RECEM NASCIDO', 'INFANTIL',
  // Doação de órgãos
  'DOADOR', 'DOADORA',
  // Modalidade de esforço/estresse (exame provocativo — não cabe em quadro agudo)
  'ESTRESSE',
  // Obstetrícia/gestação
  'OBSTETRICO', 'OBSTETRICA', 'GESTANTE', 'GESTACAO', 'PARTO', 'PUERPERA', 'PUERPERAL',
  // Cadáver/simulador
  'CADAVER', 'CADAVERICO', 'CADAVERICA',
]

// Qualificadores adicionais bloqueados quando o CID é comorbidade (não é o diagnóstico principal).
// Evita mostrar procedimentos eletivos (ex: ablação de FA) para pacientes admitidos por outro motivo.
const QUALIF_BLOQUEIO_COMORBIDADE = [
  ...QUALIF_BLOQUEIO,
  'ABLACAO', 'ELETROFISIOLOGICO', 'ELETROFISIOLOGICA',
  'TRANSPLANTE', 'IMPLANTE', 'IMPLANTACAO',
]

function temQualifNaoSolicitado(nomeProc, termo) {
  const nomeNorm = normalizarTexto(nomeProc)
  const termoNorm = normalizarTexto(termo)
  return QUALIF_BLOQUEIO.some(q => {
    const qNorm = normalizarTexto(q)
    return nomeNorm.includes(qNorm) && !termoNorm.includes(qNorm)
  })
}

function normalizarTexto(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, '')
}

// Mini-stemming: remove os últimos 2 chars em palavras longas para lidar com
// variações de gênero/número do SIGTAP (digestiva↔digestivo, hemácias↔hemácia, etc.)
function stem(w) {
  return w.length >= 7 ? w.slice(0, -2) : w
}

// Gera a query FTS a partir de um termo da IA, removendo prefixos genéricos
// ("tratamento", "procedimento") que prejudicam o ranking do Supabase FTS.
// Ex: "tratamento hemorragia digestiva alta" → "hemorragia digestiva alta"
// O ehRelevante ainda usa o termo original para filtrar.
function ftsQuery(termo) {
  const words = normalizarTexto(termo).split(/\s+/)
  const filtered = words.filter(w => !FTS_GENERICO.has(w))
  return (filtered.length > 0 ? filtered : words).join(' ')
}

function ehRelevante(nomeProc, termo) {
  const procNorm = normalizarTexto(nomeProc)
  const palavras = normalizarTexto(termo).split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w))
  if (palavras.length === 0) return true
  // Compara usando stem para tolerar digestiva↔digestivo, hemorragia↔hemorrágico, etc.
  const matches = palavras.filter(w => procNorm.includes(stem(w)))
  // 3+ palavras: exige 75% (na prática: 3 palavras→3, 4→3, 5→4).
  // Evita "HEMORRAGIA BUCO-DENTAL" passar em busca de "hemorragia digestiva alta"
  // sem que variações de gênero/número bloqueiem resultados legítimos.
  const threshold = palavras.length <= 2 ? palavras.length : Math.ceil(palavras.length * 0.75)
  return matches.length >= threshold
}

// Verifica se ao menos uma palavra-chave da descrição do CID aparece no nome do procedimento.
// Usado nos procedimentos inline do card de CID para descartar procedimentos de comorbidade
// (ex: fístula AV para I10-hipertensão, amputação para E11-diabetes).
function algumTermoPresente(nomeProc, descCid) {
  const procNorm = normalizarTexto(nomeProc)
  const palavras = normalizarTexto(descCid).split(/\s+/).filter(w => w.length >= 5 && !STOPWORDS.has(w))
  return palavras.length === 0 || palavras.some(w => procNorm.includes(stem(w)))
}

// Formata código CID: "I210" → "I21.0", "K920" → "K92.0"
function formatCidCode(code) {
  if (!code || code.length <= 3) return code
  return `${code.slice(0, 3)}.${code.slice(3)}`
}

const SESSION_V = 5 // incrementar sempre que mudar o formato/filtros dos resultados

function getSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem('aih-session') || 'null') ?? {}
    return s.v === SESSION_V ? s : {}
  } catch { return {} }
}

export function AnamnesePage() {
  const [modoUE, setModoUE] = useState(() => {
    try { return localStorage.getItem('sigtap-modo-ue') === '1' } catch { return false }
  })
  function toggleModoUE() {
    setModoUE(v => {
      const next = !v
      localStorage.setItem('sigtap-modo-ue', next ? '1' : '0')
      return next
    })
  }
  const [anamnese, setAnamnese] = useState(() => getSession().anamnese || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cids, setCids] = useState(() => getSession().cids || [])
  const [procedimentos, setProcedimentos] = useState(() => getSession().procedimentos || [])
  const [aih, setAih] = useState(() => getSession().aih || '')
  const [analyzed, setAnalyzed] = useState(() => getSession().analyzed || false)
  const [sheetProc, setSheetProc] = useState(null)
  const [cidProcs, setCidProcs] = useState(() => {  // { [co_cid]: { loading, data, open } }
    const saved = getSession().cidProcsData || {}
    return Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, { loading: false, data: v, open: false }]))
  })
  const [cidSiblings, setCidSiblings] = useState({}) // { [co_cid_pai]: { loading, data, open } }

  useEffect(() => {
    if (analyzed) {
      const cidProcsData = Object.fromEntries(Object.entries(cidProcs).map(([k, v]) => [k, v.data || []]))
      sessionStorage.setItem('aih-session', JSON.stringify({ v: SESSION_V, anamnese, cids, procedimentos, aih, analyzed, cidProcsData }))
    }
  }, [anamnese, cids, procedimentos, aih, analyzed, cidProcs])

  async function handleAnalyze() {
    if (anamnese.trim().length < 20) return
    setLoading(true)
    setError(null)
    setCids([])
    setProcedimentos([])
    setAih('')
    setAnalyzed(false)
    setCidProcs({})

    try {
      const res = await fetch('/api/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anamnese }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao analisar')
      }

      const { cids: cidsSugeridos = [], termos = [], aih: aihTexto = '' } = await res.json()

      const cidCodes = cidsSugeridos.map(c => c.co_cid).filter(Boolean)
      let cidsEnriquecidos = cidsSugeridos

      if (cidCodes.length > 0) {
        // Busca tanto os códigos específicos quanto os pais (3 chars) em uma query
        const codigosPaiUnicos = [...new Set(cidCodes.map(c => c.length > 3 ? c.slice(0, 3) : c))]
        const todosOsCodigos = [...new Set([...cidCodes, ...codigosPaiUnicos])]

        const { data: cidRows } = await supabase
          .from('cid')
          .select('co_cid, no_cid')
          .in('co_cid', todosOsCodigos)

        const cidMap = Object.fromEntries((cidRows || []).map(r => [r.co_cid, r.no_cid]))

        cidsEnriquecidos = cidsSugeridos.map(c => {
          const co_cid_pai = c.co_cid.length > 3 ? c.co_cid.slice(0, 3) : c.co_cid
          return {
            ...c,
            no_cid: cidMap[c.co_cid] ?? cidMap[co_cid_pai] ?? null,
            co_cid_pai,
            no_cid_pai: cidMap[co_cid_pai] ?? null,
          }
        })
      }

      // Fallback: se a IA não retornou termos, gera um a partir do nome do CID principal
      const termosEfetivos = termos.length > 0
        ? termos.slice(0, 5)
        : cidsEnriquecidos[0]?.no_cid
          ? [cidsEnriquecidos[0].no_cid.toLowerCase()]
          : []

      // Todas as buscas em paralelo: CID primeiro + FTS por termos
      const [cidResult, ...buscas] = await Promise.all([
        cidsSugeridos.length > 0
          ? supabase.rpc('buscar_por_cid', { query: cidsSugeridos[0].co_cid, limite: 10 })
          : Promise.resolve({ data: [] }),
        ...termosEfetivos.map(t =>
          supabase.rpc('buscar_procedimentos', { query: ftsQuery(t), limite: 20 })
        ),
      ])

      const seen = new Set()
      const procs = []
      const numTermos = buscas.length

      // CID-based: apenas TRATAMENTO (outros procedimentos ligados ao CID tendem a ser
      // irrelevantes e não passam por ehRelevante, gerando ruído nos resultados)
      for (const p of (cidResult.data || [])) {
        if (!/^TRATAMENTO\b/i.test(p.no_procedimento || '')) continue
        seen.add(p.co_procedimento)
        procs.push({ ...p, _src: -1 })
      }

      // Termos FTS: _src = índice do termo (0 = mais relevante)
      for (let i = 0; i < buscas.length; i++) {
        const termo = termosEfetivos[i] ?? ''
        for (const p of (buscas[i].data || [])) {
          if (seen.has(p.co_procedimento)) continue
          if (!ehRelevante(p.no_procedimento, termo)) continue
          if (temQualifNaoSolicitado(p.no_procedimento, termo)) continue
          seen.add(p.co_procedimento)
          procs.push({ ...p, _src: i })
        }
      }

      // Ordena por relevância:
      // 1º TRATAMENTO (diretamente vinculado ao CID > por termo > outros)
      // 2º demais procedimentos por índice de termo
      procs.sort((a, b) => {
        const aTrat = /^TRATAMENTO\b/i.test(a.no_procedimento || '')
        const bTrat = /^TRATAMENTO\b/i.test(b.no_procedimento || '')
        if (aTrat !== bTrat) return aTrat ? -1 : 1
        return a._src - b._src
      })

      procs.splice(12)

      // Pré-carrega procedimentos de todos os CIDs em paralelo para exibição imediata na coluna 3
      const seenInMain = new Set(procs.map(p => p.co_procedimento))
      const cidProcsResults = await Promise.all(
        cidsEnriquecidos.map((cid, idx) =>
          supabase.rpc('buscar_por_cid', { query: cid.co_cid_pai || cid.co_cid, limite: 15 })
            .then(({ data }) => {
              const refTermo = (cid.no_cid_pai || cid.no_cid)?.toLowerCase() || cid.co_cid
              const isPrincipal = idx === 0
              const bloqueio = isPrincipal ? QUALIF_BLOQUEIO : QUALIF_BLOQUEIO_COMORBIDADE
              const filtered = (data || [])
                .filter(p => {
                  if (seenInMain.has(p.co_procedimento)) return false
                  const nome = p.no_procedimento || ''
                  const nomeNorm = normalizarTexto(nome)
                  const termoNorm = normalizarTexto(refTermo)
                  return (
                    !bloqueio.some(q => {
                      const qNorm = normalizarTexto(q)
                      return nomeNorm.includes(qNorm) && !termoNorm.includes(qNorm)
                    }) &&
                    algumTermoPresente(nome, refTermo)
                  )
                })
                .sort((a, b) => {
                  const aTrat = /^TRATAMENTO\b/i.test(a.no_procedimento || '')
                  const bTrat = /^TRATAMENTO\b/i.test(b.no_procedimento || '')
                  if (aTrat !== bTrat) return aTrat ? -1 : 1
                  const ta = (a.vl_sa || 0) + (a.vl_sh || 0) + (a.vl_sp || 0)
                  const tb = (b.vl_sa || 0) + (b.vl_sh || 0) + (b.vl_sp || 0)
                  return tb - ta
                })
                .slice(0, 5)
              return { co_cid: cid.co_cid, data: filtered }
            })
        )
      )
      const newCidProcs = Object.fromEntries(
        cidProcsResults.map(({ co_cid, data }) => [co_cid, { loading: false, data, open: false }])
      )

      setCids(cidsEnriquecidos)
      setProcedimentos(procs)
      setAih(aihTexto)
      setCidProcs(newCidProcs)
      setAnalyzed(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleCidProcs(co_cid, isPrincipal = false) {
    const cur = cidProcs[co_cid]
    // já tem dados — apenas abre/fecha
    if (cur?.data) {
      setCidProcs(prev => ({ ...prev, [co_cid]: { ...cur, open: !cur.open } }))
      return
    }
    // já está carregando — ignora clique duplo
    if (cur?.loading) return
    // primeira abertura — inicia fetch
    setCidProcs(prev => ({ ...prev, [co_cid]: { loading: true, data: null, open: true } }))
    const cid = cids.find(c => c.co_cid === co_cid)
    const queryCode = cid?.co_cid_pai || co_cid
    const { data } = await supabase.rpc('buscar_por_cid', { query: queryCode, limite: 15 })

    // Usa a descrição do grupo pai como referência para o filtro de qualificadores
    const refTermo = (cid?.no_cid_pai || cid?.no_cid)?.toLowerCase() || co_cid
    // CIDs comorbidade usam lista de bloqueio estendida (impede ablação, transplante, etc.)
    const bloqueio = isPrincipal ? QUALIF_BLOQUEIO : QUALIF_BLOQUEIO_COMORBIDADE

    const filtered = (data || [])
      .filter(p => {
        const nome = p.no_procedimento || ''
        const nomeNorm = normalizarTexto(nome)
        const termoNorm = normalizarTexto(refTermo)
        return (
          !bloqueio.some(q => {
            const qNorm = normalizarTexto(q)
            return nomeNorm.includes(qNorm) && !termoNorm.includes(qNorm)
          }) &&
          algumTermoPresente(nome, refTermo)
        )
      })
      // ordena: TRATAMENTO primeiro (código primário de internação), depois valor desc
      .sort((a, b) => {
        const aTrat = /^TRATAMENTO\b/i.test(a.no_procedimento || '')
        const bTrat = /^TRATAMENTO\b/i.test(b.no_procedimento || '')
        if (aTrat !== bTrat) return aTrat ? -1 : 1
        const ta = (a.vl_sa || 0) + (a.vl_sh || 0) + (a.vl_sp || 0)
        const tb = (b.vl_sa || 0) + (b.vl_sh || 0) + (b.vl_sp || 0)
        return tb - ta
      })
      .slice(0, 5)

    setCidProcs(prev => ({ ...prev, [co_cid]: { loading: false, data: filtered, open: true } }))
  }

  async function toggleCidSiblings(co_cid_pai) {
    const cur = cidSiblings[co_cid_pai]
    if (cur?.data) {
      setCidSiblings(prev => ({ ...prev, [co_cid_pai]: { ...cur, open: !cur.open } }))
      return
    }
    if (cur?.loading) return
    setCidSiblings(prev => ({ ...prev, [co_cid_pai]: { loading: true, data: null, open: true } }))
    const { data } = await supabase
      .from('cid')
      .select('co_cid, no_cid')
      .like('co_cid', `${co_cid_pai}%`)
      .neq('co_cid', co_cid_pai)
      .order('co_cid')
      .limit(20)
    setCidSiblings(prev => ({ ...prev, [co_cid_pai]: { loading: false, data: data || [], open: true } }))
  }

  function handleCopyAih() {
    navigator.clipboard.writeText(aih)
    toast.success('Texto copiado!', { duration: 2000 })
  }

  /* ── Skeleton blocks ── */

  const cidsSkeleton = (
    <div>
      <Skeleton className="mb-3 h-5 w-52" />
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-1">
        {[0, 1].map(i => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/6" />
            <Skeleton className="mt-1 h-7 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )

  const procsSkeleton = (
    <div>
      <Skeleton className="mb-3 h-5 w-60" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )

  /* ── Blocos reutilizados em múltiplas colunas ── */

  const cidsBlock = (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
          {cids.length}
        </span>
        Diagnósticos CID-10 Prováveis
      </h2>
      {cids.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum CID identificado</p>
      ) : (
        /* 2-col em sm/lg; 1-col em xl (coluna dedicada) */
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-1">
          {cids.map((c, i) => (
            <div key={c.co_cid} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              {/* Header: código pai + badge */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-600">
                  {c.co_cid_pai || c.co_cid}
                </span>
                {i === 0 && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    Principal
                  </span>
                )}
              </div>
              {/* Descrição do grupo pai */}
              {(c.no_cid_pai || c.no_cid) ? (
                <p className="mt-0.5 text-xs font-medium text-slate-800 leading-snug">
                  {c.no_cid_pai || c.no_cid}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-slate-400 italic">Não encontrado</p>
              )}
              {/* Subcódigo sugerido pela IA (quando diferente do pai) */}
              {c.co_cid.length > 3 && c.no_cid && c.no_cid !== c.no_cid_pai && (
                <p className="mt-1 flex items-baseline gap-1 text-[11px]">
                  <span className="font-mono text-indigo-400 shrink-0">{formatCidCode(c.co_cid)}</span>
                  <span className="text-slate-500 leading-snug">{c.no_cid}</span>
                </p>
              )}
              {c.justificativa && (
                <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">{c.justificativa}</p>
              )}
              {/* Ver subcódigos (só quando o CID tem subcódigos, i.e., código pai ≠ código específico) */}
              {c.co_cid.length > 3 && (
                <>
                  <button
                    onClick={() => toggleCidSiblings(c.co_cid_pai || c.co_cid.slice(0, 3))}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 py-1
                               text-xs font-medium text-slate-500 transition hover:bg-slate-100 flex items-center justify-center gap-1"
                  >
                    {cidSiblings[c.co_cid_pai || c.co_cid.slice(0, 3)]?.open ? 'Ocultar subcódigos' : 'Ver subcódigos'}
                    <svg
                      className={cn('h-3 w-3 transition-transform', cidSiblings[c.co_cid_pai || c.co_cid.slice(0, 3)]?.open ? 'rotate-180' : '')}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {cidSiblings[c.co_cid_pai || c.co_cid.slice(0, 3)]?.open && (
                    <div className="mt-2 space-y-1">
                      {cidSiblings[c.co_cid_pai || c.co_cid.slice(0, 3)].loading ? (
                        [0, 1, 2].map(k => (
                          <div key={k} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
                            <Skeleton className="h-3 w-full" />
                          </div>
                        ))
                      ) : (
                        (cidSiblings[c.co_cid_pai || c.co_cid.slice(0, 3)].data || []).map(s => (
                          <div
                            key={s.co_cid}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-[11px] leading-snug',
                              s.co_cid === c.co_cid
                                ? 'border-indigo-200 bg-indigo-50'
                                : 'border-slate-100 bg-slate-50'
                            )}
                          >
                            <span className="font-mono text-indigo-500 mr-1.5">{formatCidCode(s.co_cid)}</span>
                            <span className="text-slate-600">{s.no_cid}</span>
                            {s.co_cid === c.co_cid && (
                              <span className="ml-1 text-[10px] text-indigo-400 font-medium">← sugerido</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
              <button
                onClick={() => toggleCidProcs(c.co_cid, i === 0)}
                className="mt-2 w-full rounded-lg border border-indigo-200 bg-indigo-50 py-1
                           text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 flex items-center justify-center gap-1"
              >
                {cidProcs[c.co_cid]?.open ? 'Ocultar procedimentos' : 'Ver procedimentos'}
                <svg
                  className={cn('h-3 w-3 transition-transform', cidProcs[c.co_cid]?.open ? 'rotate-180' : '')}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {cidProcs[c.co_cid]?.open && (
                <div className="mt-2 space-y-1">
                  {cidProcs[c.co_cid].loading ? (
                    [0, 1, 2].map(k => (
                      <div key={k} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 space-y-1">
                        <Skeleton className="h-2.5 w-16" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))
                  ) : cidProcs[c.co_cid].data?.length === 0 ? (
                    <p className="text-xs text-slate-400 px-1">Nenhum procedimento vinculado</p>
                  ) : (
                    <>
                      {cidProcs[c.co_cid].data.slice(0, 3).map(p => {
                        const total = (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
                        return (
                          <button
                            key={p.co_procedimento}
                            onClick={() => setSheetProc(p)}
                            className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                          >
                            <p className="font-mono text-[10px] text-slate-400">{formatCodigo(p.co_procedimento)}</p>
                            <p className="mt-0.5 text-xs font-medium leading-snug text-slate-700 line-clamp-2">{p.no_procedimento}</p>
                            <p className="mt-0.5 text-xs font-semibold text-emerald-600">{formatBRL(total)}</p>
                          </button>
                        )
                      })}
                      <Link
                        to={`/?q=${c.co_cid}`}
                        className="block pt-0.5 text-center text-[11px] font-medium text-indigo-500 hover:underline"
                      >
                        Ver todos →
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const cidProcsSecundarios = cids.flatMap(c => cidProcs[c.co_cid]?.data?.length ? [{ cid: c, data: cidProcs[c.co_cid].data }] : [])
  const totalProcCount = procedimentos.length + cidProcsSecundarios.reduce((s, e) => s + e.data.length, 0)

  const procedimentosBlock = (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
          {totalProcCount}
        </span>
        Procedimentos SIGTAP Sugeridos
      </h2>
      {totalProcCount === 0 ? (
        <p className="text-sm text-slate-400">Nenhum procedimento encontrado</p>
      ) : (
        <div className="space-y-4">
          {/* Seção principal: procedimentos da busca FTS */}
          {procedimentos.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Principais
              </p>
              <div className="space-y-2">
                {procedimentos.map((p) => (
                  <ProcedureRow key={p.co_procedimento} procedure={p} onSelect={setSheetProc} />
                ))}
              </div>
            </div>
          )}
          {/* Seção por CID: procedimentos vinculados diretamente a cada diagnóstico */}
          {cidProcsSecundarios.map(({ cid, data }) => (
            <div key={cid.co_cid}>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="font-mono text-indigo-400">{cid.co_cid_pai || cid.co_cid}</span>
                <span className="normal-case font-normal text-slate-400 truncate">{cid.no_cid_pai || cid.no_cid}</span>
              </p>
              <div className="space-y-2">
                {data.map((p) => (
                  <ProcedureRow key={p.co_procedimento} procedure={p} onSelect={setSheetProc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const showResults = analyzed || loading

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={modoUE ? "bg-gradient-to-br from-red-900 via-red-800 to-red-700" : "bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600"}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition',
                modoUE
                  ? 'border-red-300/60 bg-red-900/30 text-red-100 hover:bg-red-900/50'
                  : 'border-white/30 bg-white/15 text-white hover:bg-white/25'
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Início
            </Link>
            <button
              onClick={toggleModoUE}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition',
                modoUE
                  ? 'border-red-300/60 bg-red-500/30 text-red-100 hover:bg-red-500/40'
                  : 'border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {modoUE ? 'Modo emergência ativo' : 'Modo emergência'}
            </button>
          </div>
          <div className="mt-4">
            <h1 className="text-xl font-bold text-white sm:text-2xl">Análise de Anamnese</h1>
            <p className={cn("mt-1 text-sm", modoUE ? "text-red-200" : "text-blue-200")}>
              Cole o texto clínico e a IA identificará CIDs, procedimentos SIGTAP e gerará o texto para AIH
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/*
          Mobile  (< lg):  1 coluna
          Tablet  (lg):    2 colunas — anamnese | CIDs+Procs
          Desktop (xl+):   3 colunas — anamnese | CIDs | Procs
        */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">

          {/* ── Col 1: Input + AIH ──
              Quando !showResults: expande para ocupar todas as colunas e se centraliza */}
          <div className={`space-y-4 ${!showResults ? 'lg:col-span-2 xl:col-span-3' : ''}`}>

            <div className={!showResults ? 'mx-auto max-w-2xl' : ''}>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Texto clínico / Anamnese
                  </label>
                  {!anamnese && (
                    <button
                      onClick={() => setAnamnese(EXEMPLO)}
                      className={cn("text-xs hover:underline", modoUE ? "text-red-500" : "text-blue-500")}
                    >
                      Usar exemplo
                    </button>
                  )}
                </div>

                <textarea
                  value={anamnese}
                  onChange={e => setAnamnese(e.target.value)}
                  placeholder="Descreva o quadro clínico do paciente: queixas, história, exame físico, hipóteses diagnósticas..."
                  rows={8}
                  className={cn(
                    "w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2",
                    modoUE ? "focus:border-red-400 focus:ring-red-400/20" : "focus:border-blue-400 focus:ring-blue-400/20"
                  )}
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Sugestões geradas por IA — confirme os códigos na tabela oficial antes de usar
                  </p>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || anamnese.trim().length < 20}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-start",
                      modoUE ? "bg-red-700 hover:bg-red-800" : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Analisando...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Analisar com IA
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* AIH — só aparece após análise */}
            {analyzed && aih && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700">Texto para AIH</h2>
                  <button
                    onClick={handleCopyAih}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5
                               text-xs text-slate-600 transition hover:bg-slate-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar texto
                  </button>
                </div>
                <textarea
                  value={aih}
                  onChange={e => setAih(e.target.value)}
                  rows={10}
                  className={cn(
                    "w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2",
                    modoUE ? "focus:border-red-400 focus:ring-red-400/20" : "focus:border-blue-400 focus:ring-blue-400/20"
                  )}
                />
              </div>
            )}
          </div>

          {/* ── Col 2 (xl+): CIDs — oculta em mobile/tablet ── */}
          {showResults && (
            <div className="hidden xl:block">
              {loading ? cidsSkeleton : cidsBlock}
            </div>
          )}

          {/* ── Col 3 (xl+) / Col 2 (lg): CIDs+Procs em mobile/tablet; só Procs em desktop ── */}
          {showResults && (
            <div className="space-y-6">
              {/* CIDs visíveis apenas em mobile/tablet (em desktop ficam na col 2) */}
              <div className="xl:hidden">
                {loading ? cidsSkeleton : cidsBlock}
              </div>
              {loading ? procsSkeleton : procedimentosBlock}
            </div>
          )}

        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs text-slate-400">
          Desenvolvido por{' '}
          <span className="font-medium text-blue-400">@joaohperes</span>
          {' '}com{' '}
          <img src="/claude-icon.ico" alt="Claude" className="mb-0.5 inline h-3.5 w-3.5" />
          {' '}<span className="font-medium text-orange-400">Claude</span>
        </p>
      </footer>

      <Sheet open={!!sheetProc} onOpenChange={open => !open && setSheetProc(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {sheetProc && <ProcedureSheetContent procedure={sheetProc} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
