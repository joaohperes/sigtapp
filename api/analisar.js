import Groq from 'groq-sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { anamnese } = req.body ?? {}
  if (!anamnese?.trim()) {
    return res.status(400).json({ error: 'Texto da anamnese não informado' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada' })
  }

  const client = new Groq({ apiKey })

  const prompt = `Você é um especialista em codificação médica no SUS brasileiro (CID-10 e SIGTAP) e em preenchimento de Autorização de Internação Hospitalar (AIH).

Analise o texto clínico abaixo e retorne APENAS JSON válido com três campos:

1. "cids": lista dos CIDs-10 mais prováveis (máximo 6) diretamente relacionados ao MOTIVO DA INTERNAÇÃO ATUAL, código SEM ponto (ex: "K920") e justificativa breve. Regras para CIDs:
   - Prefira SEMPRE o CID mais específico disponível: se o texto descreve uma manifestação clínica precisa (ex: melena → K921, hematêmese → K920, dispneia → J069, edema agudo pulmão → J810), use esse código em vez do genérico "sem outra especificação"
   - Inclua comorbidades APENAS se impactarem diretamente o quadro atual
   - NÃO infira diagnósticos psiquiátricos (F00-F99) a partir de medicamentos de uso contínuo
   - NÃO inclua condições inferidas de medicamentos sem menção explícita no texto

2. "termos": lista de 3 a 5 termos de busca em português para procedimentos SIGTAP. Regras para termos:
   - O primeiro DEVE ser "tratamento de [diagnóstico principal COM qualificador anatômico]" (ex: "tratamento hemorragia digestiva alta", "tratamento infarto agudo miocardio", "tratamento pneumonia bacteriana", "tratamento avc isquemico")
   - Os demais devem ser procedimentos ESPECÍFICOS ao sistema/órgão acometido, com qualificador anatômico obrigatório (ex: "endoscopia digestiva alta diagnostica", "transfusao concentrado hemacias", "cateterismo cardiaco", "tomografia cranio")
   - NUNCA use termos genéricos sem qualificador anatômico (ex: ERRADO: "tratamento hemorragia"; CORRETO: "tratamento hemorragia digestiva alta")
   - Use terminologia SUS/SIGTAP (ex: "hemacias" não "eritrócitos", "digestiva" não "gastrointestinal")
3. "aih": parágrafo único corrido para AIH, seguindo EXATAMENTE este modelo (substitua os colchetes pelo conteúdo do texto clínico):

"Internação por [diagnóstico principal], [complicações ou contexto clínico relevante], em paciente com [antecedentes/comorbidades relevantes], com [achados clínicos na admissão: sinais vitais, estado geral], [achados laboratoriais e/ou de imagem relevantes], necessitando [lista de intervenções necessárias: tratamentos, procedimentos, monitorização]. Quadro [grave/moderado/de risco] justificando internação hospitalar em regime de [urgência/eletivo]."

Regras:
- Texto corrido, sem títulos, sem marcadores, sem quebras de linha
- NÃO inclua nenhum código CID-10 ou SIGTAP no texto
- Seja objetivo e técnico, como uma justificativa médica real para o SUS
- OBRIGATÓRIO: use acentuação correta do português (ã, ç, ê, ô, á, é, í, ó, ú, etc.) em todos os textos

Texto clínico:
${anamnese}`

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const text = completion.choices[0]?.message?.content
    if (!text) {
      return res.status(502).json({ error: 'Resposta vazia da IA' })
    }

    const raw = JSON.parse(text)

    // Normaliza nomes de campos — Llama pode retornar variações como "code", "cid", "codigo"
    const cids = (raw.cids || raw.diagnoses || raw.diagnosticos || []).map(c => ({
      co_cid: (c.co_cid || c.code || c.cid || c.codigo || '')
        .replace(/\./g, '')
        .toUpperCase()
        .trim(),
      justificativa: c.justificativa || c.justification || c.rationale || c.description || '',
    })).filter(c => c.co_cid)

    const result = { cids, termos: raw.termos || raw.terms || [], aih: raw.aih || '' }
    return res.status(200).json(result)
  } catch (err) {
    console.error('Erro ao analisar anamnese:', err)
    return res.status(500).json({ error: 'Falha ao processar a análise' })
  }
}
