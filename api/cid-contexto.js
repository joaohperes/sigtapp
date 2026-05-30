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

  const prompt = `Você é um especialista em medicina clínica e codificação no SUS brasileiro (SIGTAP/CID-10).

Para o CID-10 "${co_cid}" — "${no_cid}", gere sugestões de procedimentos SIGTAP agrupados por cenário clínico.

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
          "grupo": "diagnóstico | terapêutico | monitoramento"
        }
      ]
    }
  ],
  "coringas": [
    {
      "nome": "nome do procedimento",
      "termos_busca": ["termo1"],
      "grupo": "diagnóstico | terapêutico | monitoramento"
    }
  ]
}

Regras:
- "cenarios": 2 a 4 cenários clínicos relevantes para este CID. Cada cenário com 3 a 5 procedimentos.
- "coringas": 4 a 6 procedimentos que aparecem em QUASE TODOS os casos deste CID, independente do cenário (ex: hemograma, gasometria, hidratação EV). Estes são os procedimentos de base.
- Use terminologia SUS: "hemácias" não "eritrócitos", "tomografia" não "TC", "drenagem" não "dreno"
- "termos_busca" devem ser termos curtos para busca na tabela SIGTAP (ex: ["tomografia cranio", "sem contraste"])
- Seja específico ao sistema/órgão do CID — evite procedimentos genéricos demais
- Use acentuação correta do português em todos os textos
- Máximo de 4 cenários e 6 coringas`

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
