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
3. "aih": texto estruturado em parágrafos para laudo de AIH. Use EXATAMENTE a estrutura abaixo, separando os parágrafos com \n\n. Cada parágrafo é um texto corrido, sem títulos, sem marcadores.

PARÁGRAFO 1 — APRESENTAÇÃO CLÍNICA (sempre presente):
"Internação em caráter de [urgência/eletivo] por [diagnóstico principal com qualificação clínica, ex: hemorragia digestiva aguda com choque hipovolêmico], em paciente [contexto: oncológico em QT, diabético descompensado, etc.], admitido(a) com [achados de admissão: sinais vitais COMPLETOS com valores e unidades — PA mmHg, FC bpm, SpO₂ %, PAM mmHg se disponível — e estado geral: consciência, perfusão, etc.]."

PARÁGRAFO 2 — EXAME FÍSICO ESPECÍFICO (inclua SOMENTE se houver achados específicos relevantes além dos sinais vitais, ex: toque retal, ausculta pulmonar, abdome, déficits neurológicos):
"Exame físico [com/evidenciando] [achados específicos e relevantes ao diagnóstico]."

PARÁGRAFO 3 — EXAMES COMPLEMENTARES (inclua SOMENTE se houver resultados laboratoriais ou de imagem mencionados no texto; liste os valores COM unidades completas — g/dL, /mm³, mg/L, mmol/L, s, U/L, etc.):
"Provas diagnósticas realizadas na admissão: [exame 1 (valor unidade); exame 2 (valor unidade); ...] ."

PARÁGRAFO 4 — CONDUTAS NECESSÁRIAS (sempre presente):
"Necessitou de [lista de intervenções realizadas ou necessárias: reposição volêmica, transfusão, antibioticoterapia, monitorização hemodinâmica, procedimentos diagnósticos/terapêuticos, etc.]."

PARÁGRAFO 5 — JUSTIFICATIVA (sempre presente):
"Quadro clínico [grave/moderado/de risco], [elemento adicional de gravidade ou contexto relevante se houver], justificando internação hospitalar para [objetivos: estabilização hemodinâmica, suporte transfusional, investigação etiológica, tratamento específico, etc.]."

Regras:
- Cada parágrafo é texto corrido sem subtítulos ou marcadores
- Omita os parágrafos 2 e 3 se não houver dados suficientes no texto — nunca invente valores
- NÃO inclua nenhum código CID-10 ou SIGTAP no texto
- Inclua TODOS os valores laboratoriais mencionados no texto, com unidades corretas
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
