import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

const cacheCorrelatos = new Map()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { co_cid, no_cid } = req.body ?? {}
  if (!co_cid?.trim()) return res.status(400).json({ error: 'CID não informado' })

  const key = co_cid.trim()

  // Cache em memória por processo (Vercel reinicia, mas evita chamadas duplas)
  if (cacheCorrelatos.has(key)) return res.status(200).json(cacheCorrelatos.get(key))

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' })

  const client = new Groq({ apiKey })

  // Passo 1: Groq sugere CIDs correlatos clinicamente relevantes
  const prompt = `Você é um médico com experiência em regulação hospitalar no SUS brasileiro.

Para o CID-10 "${key}" — "${no_cid}", liste CIDs que um médico regulador usaria como DIAGNÓSTICO ALTERNATIVO para o mesmo paciente quando precisa de um código de procedimento diferente para uma AIH de transferência.

CONTEXTO: O paciente tem "${no_cid}". O código de procedimento do CID principal já está em uso. O médico precisa de um CID que:
1. Seja clinicamente justificável para o mesmo paciente (etiologia, complicação ou condição associada)
2. Provavelmente tenha um PROCEDIMENTO CLÍNICO (grupo 03) diferente na tabela SIGTAP

Retorne APENAS JSON válido:
{
  "correlatos": [
    {
      "co_cid": "código CID sem ponto, exatamente 4 chars (ex: K250)",
      "justificativa": "uma frase direta explicando a relação clínica com ${no_cid}"
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- Liste exatamente 3 a 5 CIDs
- Inclua DOIS TIPOS de correlatos:
  1. CIDs de etiologia/complicação direta (ex: para K920 → K250 úlcera gástrica, I850 varizes)
  2. CIDs "guarda-chuva" do mesmo sistema orgânico que têm códigos clínicos genéricos de tratamento
     (ex: para K359 apendicite → K929 "doença do aparelho digestivo NE", K578 "doença diverticular")
     Esses CIDs genéricos são úteis porque costumam ter códigos como "Tratamento de outras doenças do aparelho digestivo"
- NUNCA sugira CIDs de sistemas completamente diferentes
- Use sempre formato 4 chars sem ponto: K250, I850, J189, K929
- Justificativa em uma frase objetiva em português com acentuação correta`

  let cidsSugeridos = []
  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Especialista em regulação hospitalar SUS. Retorne apenas JSON válido.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.0,
    })
    const raw = JSON.parse(completion.choices[0]?.message?.content || '{}')
    cidsSugeridos = (raw.correlatos || [])
      .map(c => ({ ...c, co_cid: c.co_cid?.replace('.', '').toUpperCase().trim() }))
      .filter(c => c.co_cid && /^[A-Z]\d{3}$/.test(c.co_cid))
  } catch (err) {
    console.error('Groq error:', err)
    return res.status(500).json({ error: 'Falha ao consultar IA' })
  }

  if (cidsSugeridos.length === 0) {
    return res.status(200).json({ grupos: [] })
  }

  // Passo 2: para cada CID sugerido, busca procedimentos 03/04 no SIGTAP
  const resultados = []
  await Promise.all(cidsSugeridos.map(async ({ co_cid: cidCorr, justificativa }) => {
    const { data: procs } = await supabase.rpc('procedimentos_por_cid_regulacao', { p_co_cid: cidCorr })
    if (!procs || procs.length === 0) return

    // Filtra só procedimentos que o CID original não tem
    const { data: procsOriginal } = await supabase.rpc('procedimentos_por_cid_regulacao', { p_co_cid: key })
    const codsOriginais = new Set((procsOriginal || []).map(p => p.co_procedimento))
    const novos = procs.filter(p => {
      if (codsOriginais.has(p.co_procedimento)) return false
      // Remove procedimentos com valor zero (dados inválidos no SIGTAP)
      const total = (parseFloat(p.vl_sh) || 0) + (parseFloat(p.vl_sa) || 0) + (parseFloat(p.vl_sp) || 0)
      return total > 0
    })
    novos.forEach(p => {
      p.vl_sh = p.vl_sh ?? 0
      p.vl_sa = p.vl_sa ?? 0
      p.vl_sp = p.vl_sp ?? 0
    })
    if (novos.length === 0) return

    // Busca nome do CID
    const { data: cidData } = await supabase
      .from('cid')
      .select('no_cid')
      .eq('co_cid', cidCorr)
      .single()

    resultados.push({
      co_cid: cidCorr,
      no_cid: cidData?.no_cid || cidCorr,
      justificativa,
      procs: novos,
    })
  }))

  const resposta = { grupos: resultados }
  cacheCorrelatos.set(key, resposta)
  return res.status(200).json(resposta)
}
