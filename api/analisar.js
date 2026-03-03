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

1. "cids": lista dos CIDs-10 mais prováveis (máximo 6), código SEM ponto (ex: "K920") e justificativa breve
2. "termos": lista de 3 a 5 termos de busca em português para procedimentos SIGTAP
3. "aih": texto completo para AIH seguindo EXATAMENTE este template (preencha com base no texto clínico):

AIH – INTERNAÇÃO

Procedência: [cidade/UBS/hospital de origem do texto, ou "Não informado"]
DIAGNÓSTICO PRINCIPAL:
[descrição objetiva da condição clínica principal]
CID-10:
[código principal] – [nome do diagnóstico]
CÓDIGO DO PROCEDIMENTO (SIGTAP):
[A definir]
COMORBIDADES:
[comorbidades relevantes mencionadas no texto]
JUSTIFICATIVA:
Paciente necessita de internação hospitalar devido a [motivo principal].
• [critério clínico 1]
• [critério clínico 2]
• [critério clínico 3, se aplicável]
PROVAS DIAGNÓSTICAS:
Laboratoriais: [resultados do texto, ou "Não informado"]
Imagem: [achados de imagem do texto, ou "Não informado"]
Outros: [outros exames do texto, ou "Não informado"]

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

    const result = JSON.parse(text)
    return res.status(200).json(result)
  } catch (err) {
    console.error('Erro ao analisar anamnese:', err)
    return res.status(500).json({ error: 'Falha ao processar a análise' })
  }
}
