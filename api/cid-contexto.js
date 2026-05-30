import Groq from 'groq-sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { co_cid, no_cid } = req.body ?? {}
  if (!co_cid?.trim()) {
    return res.status(400).json({ error: 'CID não informado' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada' })
  }

  const client = new Groq({ apiKey })

  const prompt = `Você é um especialista em codificação médica no SUS brasileiro (SIGTAP/CID-10), com foco em faturamento hospitalar via AIH.

Para o CID-10 "${co_cid}" — "${no_cid}", gere sugestões de PROCEDIMENTOS SIGTAP que aparecem na AIH (Autorização de Internação Hospitalar), agrupados por cenário clínico.

FOCO OBRIGATÓRIO — inclua APENAS:
- Procedimentos terapêuticos (tratamentos, cirurgias, intervenções)
- Procedimentos invasivos (ventilação mecânica, drenagens, cateterismos terapêuticos, diálise)
- Transfusões e hemoterapia
- Procedimentos de reabilitação quando relevantes

NÃO inclua:
- Exames laboratoriais (hemograma, gasometria, troponina, PCR, culturas etc.)
- Exames de imagem (raio-X, tomografia, ressonância, ecocardiograma etc.)
- Medicamentos ou infusões (antibióticos, hidratação, analgesia, anticoagulantes etc.)
- Monitoramento (oximetria, ECG, balanço hídrico etc.)

Retorne APENAS JSON válido com este formato:
{
  "cenarios": [
    {
      "titulo": "nome curto do cenário clínico (ex: Foco pulmonar, Choque séptico, Trauma abdominal)",
      "descricao": "uma frase sobre quando usar este cenário",
      "procedimentos": [
        {
          "nome": "nome do procedimento em linguagem SIGTAP",
          "termos_busca": ["termo1", "termo2"],
          "grupo": "clínico | cirúrgico | terapêutico"
        }
      ]
    }
  ],
  "coringas": [
    {
      "nome": "nome do procedimento",
      "termos_busca": ["termo1"],
      "grupo": "clínico | cirúrgico | terapêutico"
    }
  ]
}

Regras:
- "cenarios": 2 a 4 cenários clínicos relevantes para este CID. Cada cenário com 2 a 4 procedimentos (apenas terapêuticos/cirúrgicos).
- "coringas": 2 a 4 procedimentos terapêuticos que aparecem em quase todos os casos deste CID (ex: tratamento clínico da condição principal, ventilação mecânica se aplicável, cirurgia de urgência se aplicável).
- Se o CID raramente gera procedimento específico (ex: condição ambulatorial), retorne cenarios e coringas vazios.
- Use terminologia SUS: "tratamento" não "manejo", "drenagem" não "dreno", "hemácias" não "eritrócitos"
- "termos_busca": termos curtos para busca na tabela SIGTAP (ex: ["tratamento pneumonia", "ventilacao mecanica"])
- Use acentuação correta do português em todos os textos`

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Você é especialista em medicina clínica e codificação SUS. Responda sempre em JSON válido com acentuação correta em português.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const text = completion.choices[0]?.message?.content
    if (!text) return res.status(502).json({ error: 'Resposta vazia da IA' })

    const raw = JSON.parse(text)
    return res.status(200).json({
      cenarios: raw.cenarios || [],
      coringas: raw.coringas || [],
    })
  } catch (err) {
    console.error('Erro cid-contexto:', err)
    return res.status(500).json({ error: 'Falha ao processar' })
  }
}
