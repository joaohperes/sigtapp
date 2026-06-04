import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Bump quando o prompt ou o pós-processamento mudar — invalida o cache automaticamente.
const PROMPT_VERSION = 3

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const normalizar = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (combining marks)
    .trim()

const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'a', 'o', 'as', 'os', 'em',
  'por', 'com', 'sem', 'para', 'tratamento', 'clinico', 'clinica',
])

// Radical simples: remove plural e terminações comuns para casar variações
// (pneumonia/pneumonias, arritmia/arritmias, hepatica/hepatico).
function radical(t) {
  return t
    .replace(/(coes|oes)$/, 'ao') // infeccoes -> infeccao
    .replace(/s$/, '')            // plural
    .replace(/[ao]$/, '')         // gênero (hepatico/hepatica -> hepatic)
}

const tokens = (s) =>
  normalizar(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    .map(radical)

// Similaridade de Jaccard entre conjuntos de radicais significativos.
function similaridade(a, b) {
  const sa = new Set(tokens(a))
  const sb = new Set(tokens(b))
  if (sa.size === 0 || sb.size === 0) return 0
  let inter = 0
  for (const t of sa) if (sb.has(t)) inter++
  return inter / Math.min(sa.size, sb.size)
}

const BLOQUEADOS = [
  'monitoriz', 'monitoring', 'acompanhamento', 'suporte clinico', 'suporte geral',
  'suporte nutricional', 'oxigenoterapia', 'oxigenio',
  'laboratorial', 'laboratorio', 'eletrocardiograma', 'ecocardiograma',
  'tomografia', 'radiografia', 'raio-x', 'ultrassom', 'ressonancia',
  'anticoagulacao', 'anticoagulante',
  'cateter venoso', 'acesso venoso', 'hidratacao',
  'analgesia', 'sedacao', 'vasopressor',
]

function ehBloqueado(nome) {
  const n = normalizar(nome)
  return BLOQUEADOS.some((b) => n.includes(b))
}

// Extrai o primeiro objeto JSON de uma string, tolerando texto ao redor.
function parseJSONTolerante(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    const ini = text.indexOf('{')
    const fim = text.lastIndexOf('}')
    if (ini !== -1 && fim > ini) {
      try {
        return JSON.parse(text.slice(ini, fim + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

// Procedimentos que não cabem numa AIH de internação — descartados no casamento
// mesmo com alta similaridade textual (ex: "VM invasiva DOMICILIAR" vs "VM invasiva").
const CONTEXTO_INCOMPATIVEL = ['domiciliar', 'ambulatorial', 'avaliacao do paciente']

// Só aceita como match procedimentos que podem ser principais de uma AIH:
// grupo 03 subgrupo 03 (clínicos de internação) ou grupo 04 (cirúrgicos).
// Exclui diagnósticos (0309), órteses/próteses (07), terapias ambulatoriais, etc.
function ehProcAIH(co) {
  return co?.startsWith('0303') || co?.startsWith('04')
}

// Casa o nome sugerido pela IA com um procedimento SIGTAP real.
// Só aceita o match se a similaridade for forte o bastante (evita código errado).
async function casarSigtap(nome, termosBusca) {
  const consultas = [nome, ...(termosBusca || [])].filter(Boolean)
  let melhor = null
  let melhorScore = 0

  for (const q of consultas) {
    const { data, error } = await supabase.rpc('buscar_procedimentos', {
      query: q,
      limite: 5,
    })
    if (error || !data) continue
    for (const proc of data) {
      if (!ehProcAIH(proc.co_procedimento)) continue
      const nomeProc = normalizar(proc.no_procedimento)
      if (CONTEXTO_INCOMPATIVEL.some((c) => nomeProc.includes(c))) continue
      const score = similaridade(nome, proc.no_procedimento)
      if (score > melhorScore) {
        melhorScore = score
        melhor = proc
      }
    }
  }

  // Threshold: pelo menos 60% das palavras significativas batem.
  if (melhor && melhorScore >= 0.6) {
    return {
      co_procedimento: melhor.co_procedimento,
      no_procedimento_sigtap: melhor.no_procedimento,
      vl_sh: melhor.vl_sh,
      vl_sa: melhor.vl_sa,
      vl_sp: melhor.vl_sp,
    }
  }
  return null
}

// Enriquece uma lista de procedimentos da IA com os códigos SIGTAP correspondentes.
async function enriquecerProcs(procs) {
  const filtrados = (procs || []).filter((p) => p?.nome && !ehBloqueado(p.nome))
  return Promise.all(
    filtrados.map(async (p) => {
      const match = await casarSigtap(p.nome, p.termos_busca)
      return { ...p, sigtap: match } // sigtap = null quando não houve match confiável
    })
  )
}

function montarPrompt(co_cid, no_cid) {
  return `Você é um médico intensivista e codificador do SUS com 20 anos de experiência preenchendo AIH (Autorização de Internação Hospitalar) no Brasil.

Para o CID-10 "${co_cid}" — "${no_cid}", liste os PROCEDIMENTOS SIGTAP que um médico colocaria na AIH deste paciente, agrupados por cenário clínico.

REGRAS ABSOLUTAS — o que PODE estar na AIH:
✓ Tratamentos clínicos específicos da condição (ex: "tratamento de pneumonia", "tratamento de septicemia")
✓ Cirurgias e intervenções cirúrgicas (ex: "apendicectomia", "drenagem de empiema")
✓ Ventilação mecânica invasiva ou não invasiva — SÓ quando o quadro requer suporte ventilatório
✓ Diálise/hemodiálise — SÓ quando há IRA ou DRC dialítica no quadro
✓ Transfusão de concentrado de hemácias — SÓ quando há sangramento ativo ou anemia grave
✓ Trombolítico sistêmico — SÓ em TEP maciço, AVC isquêmico, IAM com indicação
✓ Cardioversão elétrica — SÓ em arritmias com instabilidade
✓ Drenagem torácica — SÓ em pneumotórax, hemotórax, empiema
✓ Filtro de veia cava — SÓ em TEP com contraindicação a anticoagulação

PROIBIDO — NUNCA inclua:
✗ Exames laboratoriais (hemograma, gasometria, troponina, PCR, lactato, culturas)
✗ Exames de imagem (raio-X, TC, RNM, ECG, ecocardiograma, USG)
✗ Medicamentos e infusões (antibióticos, anticoagulantes, vasopressores, analgésicos, hidratação)
✗ Monitoramento (oximetria, PVC, débito urinário, sinais vitais)
✗ Suporte nutricional, cateter venoso central isolado, acesso periférico
✗ Procedimentos não relacionados ao CID em questão (ex: diálise para TEP, transfusão para pneumonia sem sangramento)

TESTE ANTES DE INCLUIR cada procedimento: "Este procedimento estaria na AIH de um paciente com ${co_cid} internado por ${no_cid}?" — se a resposta não for "sim, na maioria ou em cenário específico bem definido", EXCLUA.

Retorne APENAS JSON válido:
{
  "cenarios": [
    {
      "titulo": "cenário clínico específico (ex: TEP maciço com instabilidade, AVC isquêmico com trombolítico)",
      "descricao": "uma frase objetiva sobre quando este cenário se aplica",
      "procedimentos": [
        {
          "nome": "nome exato do procedimento SIGTAP",
          "termos_busca": ["termo1 para busca"],
          "grupo": "clínico | cirúrgico | terapêutico"
        }
      ]
    }
  ],
  "coringas": [
    {
      "nome": "procedimento presente em quase todos os casos deste CID",
      "termos_busca": ["termo1"],
      "grupo": "clínico | cirúrgico | terapêutico"
    }
  ]
}

Regras finais:
- "coringas": máximo 3. Apenas procedimentos que aparecem em >80% das AIH deste CID.
- "cenarios": 2 a 3 cenários. Cada um com 2 a 3 procedimentos realmente específicos.
- Se o CID não gera internação hospitalar tipicamente, retorne coringas:[] e cenarios:[].
- Terminologia SUS: "tratamento de" não "manejo de", use nomes que aparecem na tabela SIGTAP.
- Use acentuação correta em português em todos os textos.`
}

// ──────────────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { co_cid, no_cid, regenerar } = req.body ?? {}
  if (!co_cid?.trim()) {
    return res.status(400).json({ error: 'CID não informado' })
  }

  const cidKey = co_cid.trim().toUpperCase()

  // 1) Cache HIT — exceto se for regeneração explícita
  if (!regenerar) {
    const { data: cached } = await supabase
      .from('cid_contexto_ia')
      .select('payload, status, prompt_version')
      .eq('co_cid', cidKey)
      .maybeSingle()

    if (cached?.status === 'ready' && cached.prompt_version === PROMPT_VERSION) {
      return res.status(200).json(cached.payload)
    }
  }

  // 2) Lock atômico — evita N chamadas simultâneas ao Groq para o mesmo CID
  if (!regenerar) {
    const { data: claim } = await supabase.rpc('claim_cid_contexto', {
      p_co_cid: cidKey,
      p_version: PROMPT_VERSION,
    })

    if (claim === 'cached') {
      const { data } = await supabase
        .from('cid_contexto_ia')
        .select('payload')
        .eq('co_cid', cidKey)
        .maybeSingle()
      if (data?.payload) return res.status(200).json(data.payload)
    }

    // Outro processo está gerando — faz um curto polling pelo resultado dele.
    if (claim === 'wait') {
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1000))
        const { data } = await supabase
          .from('cid_contexto_ia')
          .select('payload, status')
          .eq('co_cid', cidKey)
          .maybeSingle()
        if (data?.status === 'ready') return res.status(200).json(data.payload)
      }
      // Timeout do polling — cai pra geração própria abaixo.
    }
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada' })
  }

  const client = new Groq({ apiKey })

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Você é especialista em medicina clínica e codificação SUS. Responda sempre em JSON válido com acentuação correta em português.',
        },
        { role: 'user', content: montarPrompt(co_cid, no_cid) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.0,
    })

    const text = completion.choices[0]?.message?.content
    const raw = parseJSONTolerante(text)
    if (!raw) {
      return res.status(502).json({ error: 'Resposta da IA em formato inválido' })
    }

    // Pós-processamento: filtra proibidos e casa com códigos SIGTAP reais.
    const cenariosBrutos = await Promise.all(
      (raw.cenarios || []).map(async (c) => ({
        ...c,
        procedimentos: await enriquecerProcs(c.procedimentos),
      }))
    )
    const cenarios = cenariosBrutos.filter((c) => c.procedimentos.length > 0)
    const coringas = await enriquecerProcs(raw.coringas)

    const resultado = { cenarios, coringas }

    // Persiste no cache marcando como pronto.
    await supabase.from('cid_contexto_ia').upsert({
      co_cid: cidKey,
      payload: resultado,
      prompt_version: PROMPT_VERSION,
      status: 'ready',
      updated_at: new Date().toISOString(),
    })

    return res.status(200).json(resultado)
  } catch (err) {
    console.error('Erro cid-contexto:', err)
    return res.status(500).json({ error: 'Falha ao processar' })
  }
}
