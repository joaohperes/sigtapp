import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { anamnese } = req.body ?? {}
  if (!anamnese?.trim()) {
    return res.status(400).json({ error: 'Texto da anamnese não informado' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada' })
  }

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: `Você é um especialista em codificação médica no SUS brasileiro (CID-10 e SIGTAP).
Analise o texto clínico e retorne JSON com:
- "cids": lista dos CIDs-10 mais prováveis (máximo 6), com código SEM ponto (ex: "K920") e justificativa breve
- "termos": lista de 3 a 5 termos de busca em português para procedimentos SIGTAP`,
      messages: [{ role: 'user', content: anamnese }],
      output_config: {
        format: {
          type: 'json_schema',
          json_schema: {
            name: 'analise_medica',
            schema: {
              type: 'object',
              properties: {
                cids: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      co_cid: { type: 'string' },
                      justificativa: { type: 'string' },
                    },
                    required: ['co_cid', 'justificativa'],
                    additionalProperties: false,
                  },
                },
                termos: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['cids', 'termos'],
              additionalProperties: false,
            },
          },
        },
      },
    })

    const text = response.content[0]?.text
    if (!text) {
      return res.status(502).json({ error: 'Resposta vazia da IA' })
    }

    const result = JSON.parse(text)
    return res.status(200).json(result)
  } catch (err) {
    console.error('Erro ao analisar anamnese:', err)
    return res.status(500).json({ error: 'Falha ao processar a análise' })
  }
}
