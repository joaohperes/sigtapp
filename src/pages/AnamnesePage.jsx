import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { ProcedureRow } from '../components/ProcedureCard'
import { ProcedureSheetContent } from '../components/ProcedureSheetContent'
import { useModoUE } from '../contexts/ModoUEContext'
import { useTheme } from '../contexts/ThemeContext'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { HelpSheet, HelpButton } from '../components/HelpSheet'

const EXEMPLOS = [
  {
    titulo: 'IAM com supra de ST',
    subtitulo: 'Dor torácica + ECG com supra',
    texto: 'Paciente masculino, 58 anos, hipertenso e diabético tipo 2. Queixa de dor torácica opressiva com irradiação para o membro superior esquerdo iniciada há 2 horas, associada a sudorese fria, náuseas e dispneia. Pressão arterial 160/100 mmHg, FC 98 bpm. ECG com supradesnivelamento de ST em V1-V4.',
  },
  {
    titulo: 'AVC isquêmico',
    subtitulo: 'Hemiplegia + afasia súbita',
    texto: 'Paciente feminina, 72 anos, hipertensa em uso de AAS, trazida por familiares com hemiplegia direita e afasia de início súbito há 3 horas. Exame neurológico: NIHSS 14, GCS 13. TC crânio sem contraste: sem hemorragia. Admitida para avaliação de trombólise endovenosa.',
  },
  {
    titulo: 'Pneumonia com sepse',
    subtitulo: 'Febre + consolidação bilateral',
    texto: 'Paciente feminina, 78 anos, diabética e hipertensa, trazida por rebaixamento de consciência e febre há 2 dias. Admissão em sepse: PA 96/62 mmHg, FC 108 bpm, SpO₂ 88% em ar ambiente → cateter O₂ 5L/min. Leucócitos 18.400 com 22% bastões, PCR 184 mg/L, lactato 3,1 mmol/L. Radiografia: consolidação lobar bilateral. Prescrito ceftriaxona + azitromicina EV.',
  },
  {
    titulo: 'Apendicite aguda',
    subtitulo: 'Dor FID + Blumberg positivo',
    texto: 'Paciente masculino, 22 anos, previamente hígido, admitido com dor abdominal em fossa ilíaca direita há 18 horas, início periumbilical com migração para FID, náuseas, vômitos e febre 38,2°C. Blumberg e Rovsing positivos, defesa muscular localizada. Leucócitos 14.800. TC de abdome confirmou apendicite aguda sem perfuração. Encaminhado para apendicectomia.',
  },
]

const EXEMPLO = EXEMPLOS[0].texto

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
  // Tipo etiológico de choque — bloqueia "cardiogênico" em quadros não cardíacos
  'CARDIOGENICO',
  // Oncologia — procedimentos específicos para paciente oncológico
  'ONCOLOGICO', 'ONCOLOGICA',
  // Fisioterapia/reabilitação — não pertence a internação aguda
  'FISIOTERAPICO', 'FISIOTERAPICA', 'FISIOTERAPIA', 'FISIOTERAPEUTICO', 'FISIOTERAPEUTICA',
  // Rotação intestinal — malformação congênita, não pertence a quadros abdominais agudos comuns
  'ROTACAO',
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

// Raiz mais agressiva para algumTermoPresente: tolera variações morfológicas entre
// diagnóstico e procedimento (ex: "apendicite" → "apendic" casa com "apendicectomia").
// Stem padrão daria "apendici" que não está em "apendicectomia".
function raiz(w) {
  if (w.length >= 8) return w.slice(0, -3)
  if (w.length >= 6) return w.slice(0, -2)
  return w
}

// Verifica se ao menos uma palavra-chave da descrição do CID aparece no nome do procedimento.
// Usado nos procedimentos inline do card de CID para descartar procedimentos de comorbidade
// (ex: fístula AV para I10-hipertensão, amputação para E11-diabetes).
function algumTermoPresente(nomeProc, descCid) {
  const procNorm = normalizarTexto(nomeProc)
  const palavras = normalizarTexto(descCid).split(/\s+/).filter(w => w.length >= 5 && !STOPWORDS.has(w))
  return palavras.length === 0 || palavras.some(w => procNorm.includes(raiz(w)))
}

// Formata código CID: "I210" → "I21.0", "K920" → "K92.0"
function formatCidCode(code) {
  if (!code || code.length <= 3) return code
  return `${code.slice(0, 3)}.${code.slice(3)}`
}

const SESSION_V = 11 // incrementar sempre que mudar o formato/filtros dos resultados
const SAVED_KEY = 'sigtap-analises-salvas'
const MAX_SAVED = 10

function getSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem('aih-session') || 'null') ?? {}
    return s.v === SESSION_V ? s : {}
  } catch { return {} }
}

export function AnamnesePage() {
  const { modoUE } = useModoUE()
  const { dark } = useTheme()
  const [anamnese, setAnamnese] = useState(() => getSession().anamnese || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cids, setCids] = useState(() => getSession().cids || [])
  const [procedimentos, setProcedimentos] = useState(() => getSession().procedimentos || [])
  const [aih, setAih] = useState(() => getSession().aih || '')
  const [analyzed, setAnalyzed] = useState(() => getSession().analyzed || false)
  const [sheetProc, setSheetProc] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [inputAberto, setInputAberto] = useState(true) // barra de anamnese recolhível após análise
  const [aihOpen, setAihOpen] = useState(false) // painel lateral (sheet) do laudo AIH
  const [cidProcs, setCidProcs] = useState(() => {  // { [co_cid]: { loading, data, open } }
    const saved = getSession().cidProcsData || {}
    return Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, { loading: false, data: v, open: false }]))
  })
  const [cidSiblings, setCidSiblings] = useState({}) // { [co_cid_pai]: { loading, data, open } }
  const [openProcCids, setOpenProcCids] = useState({}) // { [co_cid]: boolean }

  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') } catch { return [] }
  })

  function handleSalvar() {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      titulo: anamnese.slice(0, 80).trim(),
      anamnese,
      cids,
      procedimentos,
      aih,
    }
    const updated = [entry, ...savedAnalyses].slice(0, MAX_SAVED)
    setSavedAnalyses(updated)
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated))
    toast.success('Análise salva!', { duration: 2000 })
  }

  function handleLoadSaved(entry) {
    setAnamnese(entry.anamnese)
    setCids(entry.cids || [])
    setProcedimentos(entry.procedimentos || [])
    setAih(entry.aih || '')
    setAnalyzed(true)
    setCidProcs({})
    setCidSiblings({})
    setError(null)
  }

  function handleDeleteSaved(id) {
    const updated = savedAnalyses.filter(a => a.id !== id)
    setSavedAnalyses(updated)
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated))
  }

  function handleNova() {
    setAnamnese('')
    setCids([])
    setProcedimentos([])
    setAih('')
    setAnalyzed(false)
    setCidProcs({})
    setCidSiblings({})
    setOpenProcCids({})
    setError(null)
    sessionStorage.removeItem('aih-session')
  }

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
    setOpenProcCids({})

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
      const refTermoPrincipal = normalizarTexto(cidsEnriquecidos[0]?.no_cid_pai || cidsEnriquecidos[0]?.no_cid || '')
      for (const p of (cidResult.data || [])) {
        if (!/^TRATAMENTO\b/i.test(p.no_procedimento || '')) continue
        if (p.no_financiamento?.includes('PAB')) continue
        // Modo emergência: apenas clínicos (03) e cirúrgicos (04)
        if (modoUE && !/^0[34]/.test(p.co_procedimento || '')) continue
        const nomeNorm = normalizarTexto(p.no_procedimento || '')
        if (QUALIF_BLOQUEIO.some(q => {
          const qNorm = normalizarTexto(q)
          return nomeNorm.includes(qNorm) && !refTermoPrincipal.includes(qNorm)
        })) continue
        seen.add(p.co_procedimento)
        procs.push({ ...p, _src: -1 })
      }

      // Termos FTS: _src = índice do termo (0 = mais relevante)
      for (let i = 0; i < buscas.length; i++) {
        const termo = termosEfetivos[i] ?? ''
        for (const p of (buscas[i].data || [])) {
          if (seen.has(p.co_procedimento)) continue
          if (p.no_financiamento?.includes('PAB')) continue
          // Modo emergência: apenas clínicos (03) e cirúrgicos (04)
          if (modoUE && !/^0[34]/.test(p.co_procedimento || '')) continue
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
        cidsEnriquecidos.map(async (cid, idx) => {
          const queryCode = cid.co_cid_pai || cid.co_cid
          let { data } = await supabase.rpc('buscar_por_cid', { query: queryCode, limite: 15 })
          // Fallback: SIGTAP às vezes linka procs ao subcódigo específico (K350) e não ao pai (K35).
          // 1º: tenta o subcódigo sugerido pela IA (ex: K350); 2º: tenta subcódigo NE (X9).
          if (!data?.length && queryCode.length === 3) {
            if (cid.co_cid !== queryCode) {
              const { data: fb1 } = await supabase.rpc('buscar_por_cid', { query: cid.co_cid, limite: 15 })
              if (fb1?.length) data = fb1
            }
            if (!data?.length) {
              const { data: fb2 } = await supabase.rpc('buscar_por_cid', { query: queryCode + '9', limite: 15 })
              if (fb2?.length) data = fb2
            }
          }
          const refTermo = (cid.no_cid_pai || cid.no_cid)?.toLowerCase() || cid.co_cid
          const isPrincipal = idx === 0
          const bloqueio = isPrincipal ? QUALIF_BLOQUEIO : QUALIF_BLOQUEIO_COMORBIDADE
          const filtered = (data || [])
                .filter(p => {
                  // Para o CID principal não desduplicamos: o usuário quer ver os procs do diagnóstico primário
                  // mesmo que já apareçam em Principais. Para comorbidades, evita repetição.
                  if (!isPrincipal && seenInMain.has(p.co_procedimento)) return false
                  if (p.no_financiamento?.includes('PAB')) return false
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
      const newCidProcs = Object.fromEntries(
        cidProcsResults.map(({ co_cid, data }) => [co_cid, { loading: false, data, open: false }])
      )

      setCids(cidsEnriquecidos)
      setProcedimentos(procs)
      setAih(aihTexto)
      setCidProcs(newCidProcs)
      setAnalyzed(true)
      setInputAberto(false) // recolhe a anamnese para dar espaço aos resultados
      if (aihTexto) setAihOpen(true) // abre o laudo automaticamente após a análise
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
    try {
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
    } catch {
      setCidProcs(prev => ({ ...prev, [co_cid]: { loading: false, data: [], open: true } }))
    }
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
          <div key={i} className="rounded-xl bg-card p-3 border border-border border-l-2 border-l-foreground/20 space-y-2">
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
          <div key={i} className="rounded-xl bg-card p-3 border border-border border-l-2 border-l-emerald-500/40 space-y-2">
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
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          {cids.length}
        </span>
        Diagnósticos CID-10 Prováveis
      </h2>
      {cids.length === 0 ? (
        <p className="text-sm text-muted-foreground/70">Nenhum CID identificado</p>
      ) : (
        /* 2-col em sm/lg; 1-col em xl (coluna dedicada) */
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-1">
          {cids.map((c, i) => (
            <div key={c.co_cid} className="rounded-xl bg-card p-3 border border-border border-l-2 border-l-foreground/30">
              {/* Header: código pai + badge */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">
                  {c.co_cid_pai || c.co_cid}
                </span>
                {i === 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Principal
                  </span>
                )}
              </div>
              {/* Descrição do grupo pai */}
              {(c.no_cid_pai || c.no_cid) ? (
                <p className="mt-0.5 text-xs font-medium text-foreground leading-snug">
                  {c.no_cid_pai || c.no_cid}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground/70 italic">Não encontrado</p>
              )}
              {/* Subcódigo sugerido pela IA (quando diferente do pai) */}
              {c.co_cid.length > 3 && c.no_cid && c.no_cid !== c.no_cid_pai && (
                <p className="mt-1 flex items-baseline gap-1 text-[11px]">
                  <span className="font-mono text-primary/70 shrink-0">{formatCidCode(c.co_cid)}</span>
                  <span className="text-muted-foreground leading-snug">{c.no_cid}</span>
                </p>
              )}
              {c.justificativa && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{c.justificativa}</p>
              )}
              {/* 2 pills lado a lado: subcódigos | procedimentos */}
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => toggleCidSiblings(c.co_cid_pai || c.co_cid.slice(0, 3))}
                  className="rounded-lg border border-border bg-secondary py-1 px-2
                             text-xs font-medium text-muted-foreground transition hover:bg-accent flex items-center justify-center gap-1"
                >
                  Subcódigos
                  <svg
                    className={cn('h-3 w-3 transition-transform shrink-0', cidSiblings[c.co_cid_pai || c.co_cid.slice(0, 3)]?.open ? 'rotate-180' : '')}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleCidProcs(c.co_cid, i === 0)}
                  className="rounded-lg border border-primary/30 bg-primary/10 py-1 px-2
                             text-xs font-medium text-primary transition hover:bg-primary/20 flex items-center justify-center gap-1"
                >
                  Procedimentos
                  <svg
                    className={cn('h-3 w-3 transition-transform shrink-0', cidProcs[c.co_cid]?.open ? 'rotate-180' : '')}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {cidSiblings[c.co_cid_pai || c.co_cid.slice(0, 3)]?.open && (
                <div className="mt-2 space-y-1">
                  {cidSiblings[c.co_cid_pai || c.co_cid.slice(0, 3)].loading ? (
                    [0, 1, 2].map(k => (
                      <div key={k} className="rounded-lg border border-border bg-secondary px-3 py-1.5">
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
                            ? 'border-primary/30 bg-primary/10'
                            : 'border-border bg-secondary'
                        )}
                      >
                        <span className="font-mono text-primary mr-1.5">{formatCidCode(s.co_cid)}</span>
                        <span className="text-muted-foreground">{s.no_cid}</span>
                        {s.co_cid === c.co_cid && (
                          <span className="ml-1 text-[10px] text-primary/70 font-medium">← sugerido</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
              {cidProcs[c.co_cid]?.open && (
                <div className="mt-2 space-y-1">
                  {cidProcs[c.co_cid].loading ? (
                    [0, 1, 2].map(k => (
                      <div key={k} className="rounded-lg border border-border bg-secondary px-3 py-2 space-y-1">
                        <Skeleton className="h-2.5 w-16" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))
                  ) : cidProcs[c.co_cid].data?.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70 px-1">{i === 0 ? 'Procedimentos incluídos em Principais ↑' : 'Nenhum procedimento vinculado'}</p>
                  ) : (
                    <>
                      {cidProcs[c.co_cid].data.slice(0, 3).map(p => {
                        const total = (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
                        return (
                          <button
                            key={p.co_procedimento}
                            onClick={() => setSheetProc(p)}
                            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-left transition hover:border-foreground/20 hover:bg-accent"
                          >
                            <p className="font-mono text-[10px] text-muted-foreground/70">{formatCodigo(p.co_procedimento)}</p>
                            <p className="mt-0.5 text-xs font-medium leading-snug text-foreground/90 line-clamp-2">{p.no_procedimento}</p>
                            <p className="mt-0.5 text-xs font-semibold text-emerald-600">{formatBRL(total)}</p>
                          </button>
                        )
                      })}
                      <Link
                        to={`/?q=${c.co_cid}`}
                        className="block pt-0.5 text-center text-[11px] font-medium text-primary hover:underline"
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
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
          {totalProcCount}
        </span>
        Procedimentos SIGTAP Sugeridos
      </h2>
      {totalProcCount === 0 ? (
        <p className="text-sm text-muted-foreground/70">Nenhum procedimento encontrado</p>
      ) : (
        <div className="space-y-4">
          {/* Seção principal: procedimentos da busca FTS */}
          {procedimentos.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
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
          {cidProcsSecundarios.map(({ cid, data }, i) => {
            const isOpen = openProcCids[cid.co_cid] ?? (i === 0)
            return (
              <div key={cid.co_cid} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <button
                  onClick={() => setOpenProcCids(s => ({ ...s, [cid.co_cid]: !isOpen }))}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-secondary"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">{cid.co_cid_pai || cid.co_cid}</span>
                    <span className="text-sm text-muted-foreground truncate">{cid.no_cid_pai || cid.no_cid}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary/80">{data.length}</span>
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="border-t border-border p-3 space-y-2">
                    {data.map((p) => (
                      <ProcedureRow key={p.co_procedimento} procedure={p} onSelect={setSheetProc} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const showResults = analyzed || loading

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={modoUE ? "bg-gradient-to-br from-red-950 via-red-900 to-red-800" : "border-b border-border bg-card"}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
          <div>
            <h1 className={cn("text-lg font-bold sm:text-xl", modoUE ? "text-white" : "text-foreground")}>Análise de Anamnese</h1>
            <p className={cn("mt-0.5 text-sm", modoUE ? "text-red-200" : "text-muted-foreground")}>
              Cole o texto clínico e a IA identificará CIDs, procedimentos SIGTAP e gerará o texto para AIH
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <HelpButton onClick={() => setHelpOpen(true)} dark={modoUE || dark} />
            {showResults && (
            <button
              onClick={handleNova}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition",
                modoUE
                  ? "border-red-300/50 bg-red-900/30 text-red-100 hover:bg-red-900/50"
                  : dark
                    ? "border-border bg-secondary text-foreground hover:bg-accent"
                    : "border-border bg-secondary text-foreground/90 hover:bg-accent"
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova análise
            </button>
          )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/*
          Sem resultados: input grande centralizado (landing).
          Com resultados: 2 colunas — [CIDs+procs] | [AIH sticky]; input vira
          barra recolhível no topo (full width).
        */}
        {/* Barra de anamnese recolhível — só quando há resultados e está fechada */}
        {showResults && !inputAberto && (
          <button
            onClick={() => setInputAberto(true)}
            className="mb-6 flex w-full items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:border-foreground/20"
          >
            <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Anamnese analisada</span>
              <span className="ml-2 text-muted-foreground/70">{anamnese.slice(0, 80)}…</span>
            </span>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">editar ▾</span>
          </button>
        )}

        <div className="mx-auto max-w-4xl">

          {/* Resultados ocupam a largura toda; AIH abre em painel lateral. */}
          <div className="space-y-6">

            {/* Input — estilo busca do Diagnóstico: textarea leve, sem card pesado */}
            <div className={cn(
              !showResults ? 'mx-auto max-w-2xl pt-2' : '',
              showResults && !inputAberto && 'hidden'
            )}>
                {!showResults && (
                  <div className="mb-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-foreground">Da anamnese ao laudo, em segundos</h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Cole o texto clínico — a IA faz o resto.
                      </p>
                    </div>
                    {/* Fluxo de 3 passos */}
                    <div className="mt-5 flex items-center justify-center gap-2 text-xs">
                      {[
                        { ic: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Texto clínico' },
                        { ic: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'CID-10' },
                        { ic: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'SIGTAP + AIH' },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
                            <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.ic} />
                            </svg>
                            <span className="font-medium">{s.label}</span>
                          </div>
                          {i < 2 && (
                            <svg className="h-3.5 w-3.5 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="relative">
                  <textarea
                    value={anamnese}
                    onChange={e => setAnamnese(e.target.value)}
                    placeholder="Descreva o quadro clínico: queixas, história, exame físico, sinais vitais, exames, hipóteses..."
                    rows={8}
                    className={cn(
                      "w-full resize-y rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition",
                      modoUE && "focus:border-red-400 focus:ring-red-400/20"
                    )}
                  />
                  {!anamnese && (
                    <button
                      onClick={() => setAnamnese(EXEMPLO)}
                      className="absolute right-3 top-3 text-[11px] text-muted-foreground/60 hover:text-foreground transition"
                    >
                      Usar exemplo
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || anamnese.trim().length < 20}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                      modoUE ? "bg-red-700 text-white hover:bg-red-800" : "bg-foreground text-background hover:bg-foreground/90"
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
                  <p className="mt-2.5 text-center text-[11px] text-muted-foreground/60">
                    Sugestões geradas por IA — confirme os códigos na tabela oficial antes de usar
                  </p>
                </div>

                {error && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                    {error}
                  </div>
                )}
            {/* Análises salvas — visíveis apenas antes da análise */}
            {!showResults && savedAnalyses.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Análises salvas
                </p>
                <div className="space-y-2">
                  {savedAnalyses.map(entry => (
                    <div key={entry.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                      <button
                        onClick={() => handleLoadSaved(entry)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-medium text-foreground/90">{entry.titulo}</p>
                        <p className="text-xs text-muted-foreground/70">
                          {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {entry.cids?.length > 0 && ` · ${entry.cids.length} CID${entry.cids.length > 1 ? 's' : ''}`}
                        </p>
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(entry.id)}
                        className="shrink-0 rounded p-1 text-muted-foreground/50 transition hover:bg-red-50 hover:text-red-400"
                        title="Remover"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cards de exemplo — visíveis apenas antes da análise */}
            {!showResults && (
              <div className="mt-4">
                <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wide", "text-muted-foreground/70")}>
                  Exemplos clínicos
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {EXEMPLOS.map(ex => (
                    <button
                      key={ex.titulo}
                      onClick={() => setAnamnese(ex.texto)}
                      className={cn(
                        'group flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition',
                        modoUE
                            ? 'border-border bg-card hover:border-red-500/40 hover:bg-red-500/5'
                            : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">{ex.titulo}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/70">{ex.subtitulo}</p>
                      </div>
                      <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition group-hover:text-primary group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* CIDs + procedimentos — coluna esquerda, juntos */}
            {showResults && (
              <>
                {loading ? cidsSkeleton : cidsBlock}
                {loading ? procsSkeleton : procedimentosBlock}
              </>
            )}
          </div>

        </div>
      </main>

      {/* Botão flutuante "Ver laudo AIH" — abre o painel lateral */}
      {showResults && analyzed && aih && (
        <button
          onClick={() => setAihOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition hover:scale-105",
            modoUE ? "bg-red-700 text-white hover:bg-red-800" : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Ver laudo AIH
        </button>
      )}



      <Sheet open={!!sheetProc} onOpenChange={open => !open && setSheetProc(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {sheetProc && <ProcedureSheetContent procedure={sheetProc} />}
        </SheetContent>
      </Sheet>

      {/* Painel lateral do laudo AIH */}
      <Sheet open={aihOpen} onOpenChange={setAihOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <div className="mb-3 flex items-center justify-between gap-2 pr-8">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Texto para AIH</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">{aih.length} caracteres · editável</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSalvar}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Salvar
              </button>
              <button
                onClick={handleCopyAih}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  modoUE ? "bg-red-700 text-white hover:bg-red-800" : "bg-foreground text-background hover:bg-foreground/90"
                )}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar
              </button>
            </div>
          </div>
          <textarea
            value={aih}
            onChange={e => setAih(e.target.value)}
            className={cn(
              "flex-1 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2",
              modoUE ? "focus:border-red-400 focus:ring-red-400/20" : "focus:border-foreground/30 focus:ring-foreground/10"
            )}
          />
        </SheetContent>
      </Sheet>
      <HelpSheet pagina="anamnese" open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
