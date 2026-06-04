import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Bump quando o prompt ou o pós-processamento mudar — invalida o cache automaticamente.
const PROMPT_VERSION = 5

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

// Fração dos tokens da consulta presentes no nome do procedimento.
function cobertura(consulta, nomeProc) {
  const sc = new Set(tokens(consulta))
  if (sc.size === 0) return 0
  const sp = new Set(tokens(nomeProc))
  let inter = 0
  for (const t of sc) if (sp.has(t)) inter++
  return inter / sc.size
}

// Núcleos clínicos genéricos demais para casar com segurança: sozinhos, casariam
// com procedimentos de contexto errado (ex: "choque"→"choque anafilático",
// "dor"→"dor por estereotaxia"). Se o nome da IA se resume a um destes, não casa.
// Valores são os radicais já processados por radical() (ver tokens()).
const NUCLEOS_GENERICOS = new Set([
  'dor', 'choque', 'infecca', 'infeca', 'hemorragi', 'sangrament',
  'traum', 'traumatism', 'fratur', 'lesa', 'sepse', 'septicemi', 'edem',
])

// Verifica se o nome (sem stopwords) é só um conceito genérico perigoso.
function ehNomeGenerico(nome) {
  const t = tokens(nome)
  return t.length > 0 && t.every((tok) => NUCLEOS_GENERICOS.has(tok))
}

// Casa o nome sugerido pela IA com um procedimento SIGTAP real.
//
// Estratégia: confia no ranking da buscar_procedimentos (trigram + substring),
// que já fez o trabalho semântico, e valida o TOP resultado de cada consulta:
//  - rejeita nomes genéricos perigosos (só "dor", "choque", "fratura"...);
//  - filtra para procedimentos de AIH (grupo 0303 clínico / 04 cirúrgico);
//  - exige que a consulta esteja inteiramente coberta pelo nome do procedimento;
//  - desambigua termos genéricos de 1 palavra (ex: "ventilação", "fratura")
//    aceitando só quando o nome da IA tem 2+ tokens cobertos OU o token bate
//    com o núcleo do procedimento (1ª palavra significativa — "pneumonias..."
//    casa "pneumonia", mas "...tubo de ventilação" não casa "ventilação").
async function casarSigtap(nome, termosBusca) {
  // Rede de segurança: nome genérico demais nunca casa (vira pill de busca).
  if (ehNomeGenerico(nome)) return null

  // Termos primeiro (mais limpos que o nome completo), depois o nome.
  // Descarta termos de busca que também sejam genéricos isolados.
  const consultas = [...(termosBusca || []), nome]
    .filter(Boolean)
    .filter((q) => !ehNomeGenerico(q))
  if (consultas.length === 0) return null
  const tokensNome = new Set(tokens(nome))

  for (const q of consultas) {
    const { data, error } = await supabase.rpc('buscar_procedimentos', {
      query: q,
      limite: 8,
    })
    if (error || !data) continue

    const candidatos = data.filter(
      (p) =>
        ehProcAIH(p.co_procedimento) &&
        !CONTEXTO_INCOMPATIVEL.some((c) => normalizar(p.no_procedimento).includes(c))
    )
    if (candidatos.length === 0) continue

    const top = candidatos[0] // melhor ranqueado pela busca
    if (cobertura(q, top.no_procedimento) !== 1) continue // consulta não coberta

    const tokensProc = tokens(top.no_procedimento)
    const setProc = new Set(tokensProc)
    const nomeCoberto = [...tokensNome].filter((t) => setProc.has(t)).length
    const nucleoBate = tokensProc.length > 0 && new Set(tokens(q)).has(tokensProc[0])

    if (nomeCoberto >= 2 || nucleoBate) {
      return {
        co_procedimento: top.co_procedimento,
        no_procedimento_sigtap: top.no_procedimento,
        vl_sh: top.vl_sh,
        vl_sa: top.vl_sa,
        vl_sp: top.vl_sp,
      }
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

╔═══════════════════════════════════════════════════════════════════════╗
║ REGRA Nº 1 — ESPECIFICIDADE (a mais importante de todas)              ║
╚═══════════════════════════════════════════════════════════════════════╝
Cada procedimento deve ter um nome ESPECÍFICO E NOMEÁVEL que exista na
tabela SIGTAP. NUNCA escreva um conceito clínico genérico.

PROIBIDO (conceitos vagos — geram código ERRADO):
✗ "Tratamento de dor"        → casaria erradamente com "dor por estereotaxia"
✗ "Tratamento de choque"     → casaria erradamente com "choque anafilático"
✗ "Tratamento de infecção"   → vago demais, qualquer infecção
✗ "Tratamento de hemorragia" → casaria com "hemorragia das vias respiratórias"
✗ "Tratamento de fratura"    → qual fratura? de qual osso/região?
✗ "Tratamento de trauma"     → vago demais

CORRETO (procedimento específico, nomeável):
✓ "Laparotomia exploradora"
✓ "Craniotomia descompressiva"
✓ "Tratamento de pneumonias ou influenza"
✓ "Tratamento de fratura de fêmur"
✓ "Drenagem de tórax fechada"
✓ "Tratamento de septicemia"

REGRA DE OURO: se você não consegue nomear o procedimento SIGTAP específico
e real, NÃO o inclua. É melhor 2 procedimentos certos que 4 com 1 errado.

╔═══════════════════════════════════════════════════════════════════════╗
║ O que PODE estar na AIH                                                ║
╚═══════════════════════════════════════════════════════════════════════╝
✓ Tratamentos clínicos específicos da condição
✓ Cirurgias e intervenções cirúrgicas nomeadas
✓ Ventilação mecânica invasiva ou não invasiva — SÓ quando requer suporte ventilatório
✓ Diálise/hemodiálise — SÓ quando há IRA ou DRC dialítica no quadro
✓ Transfusão de concentrado de hemácias — SÓ quando há sangramento ativo ou anemia grave
✓ Trombolítico sistêmico — SÓ em TEP maciço, AVC isquêmico, IAM com indicação
✓ Cardioversão elétrica — SÓ em arritmias com instabilidade
✓ Drenagem torácica — SÓ em pneumotórax, hemotórax, empiema

PROIBIDO — NUNCA inclua:
✗ Exames laboratoriais (hemograma, gasometria, troponina, PCR, lactato, culturas)
✗ Exames de imagem (raio-X, TC, RNM, ECG, ecocardiograma, USG)
✗ Medicamentos e infusões (antibióticos, anticoagulantes, vasopressores, analgésicos, hidratação)
✗ Monitoramento (oximetria, PVC, débito urinário, sinais vitais)
✗ Suporte nutricional, cateter venoso central isolado, acesso periférico
✗ Procedimentos não relacionados ao CID em questão

TESTE ANTES DE INCLUIR cada procedimento: "Este procedimento estaria na AIH de
um paciente com ${co_cid} internado por ${no_cid}, E eu consigo nomeá-lo
especificamente?" — se a resposta a qualquer parte for não, EXCLUA.

Retorne APENAS JSON válido:
{
  "cenarios": [
    {
      "titulo": "cenário clínico específico (ex: TCE grave com indicação cirúrgica)",
      "descricao": "uma frase objetiva sobre quando este cenário se aplica",
      "procedimentos": [
        {
          "nome": "nome específico e nomeável do procedimento SIGTAP",
          "termos_busca": ["palavra-chave específica para busca na tabela"],
          "grupo": "clínico | cirúrgico | terapêutico"
        }
      ]
    }
  ],
  "coringas": [
    {
      "nome": "procedimento específico presente em quase todos os casos deste CID",
      "termos_busca": ["palavra-chave específica"],
      "grupo": "clínico | cirúrgico | terapêutico"
    }
  ]
}

Regras finais:
- "coringas": máximo 3. Apenas procedimentos específicos que aparecem em >80% das AIH deste CID.
- "cenarios": 2 a 3 cenários. Cada um com 1 a 3 procedimentos específicos e nomeáveis.
- Se o CID não gera internação hospitalar tipicamente, retorne coringas:[] e cenarios:[].
- "termos_busca": use a palavra-chave mais distintiva do procedimento (ex: "laparotomia",
  "craniotomia", "pneumonia"), nunca um conceito genérico isolado ("dor", "choque", "infecção").
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
