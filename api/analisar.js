export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { anamnese } = req.body ?? {}
  if (!anamnese?.trim()) {
    return res.status(400).json({ error: 'Texto da anamnese não informado' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada' })
  }

  const prompt = `Você é um especialista em codificação médica no SUS brasileiro (CID-10 e SIGTAP).
Analise o texto clínico abaixo e retorne APENAS JSON válido, sem texto adicional, com:
- "cids": lista dos CIDs-10 mais prováveis (máximo 6), com o código SEM ponto (ex: "K920" e não "K92.0") e uma justificativa breve
- "termos": lista de 3 a 5 termos de busca em português para encontrar procedimentos SIGTAP relevantes (ex: "endoscopia digestiva alta", "colecistectomia laparoscópica")

Formato obrigatório:
{
  "cids": [{ "co_cid": "K920", "justificativa": "Melena e hematêmese descritas" }],
  "termos": ["endoscopia digestiva", "hemostasia endoscópica"]
}

Texto clínico:
${anamnese}`

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      console.error('Gemini error:', err)
      return res.status(502).json({ error: 'Erro ao chamar a API de IA' })
    }

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

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
