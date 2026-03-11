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

1. "cids": lista dos CIDs-10 mais prováveis (máximo 8) relacionados ao quadro atual, código SEM ponto (ex: "K920") e justificativa breve. Regras para CIDs:
   - O PRIMEIRO CID deve ser o diagnóstico principal (motivo da internação)
   - Inclua também: comorbidades ativas que impactam o quadro, complicações evidentes, condições associadas relevantes para o manejo (ex: IAM + I10-hipertensão + E11-diabetes + R00.0-taquicardia + J96-insuficiência respiratória se presente)
   - Prefira SEMPRE o CID mais específico disponível: se o texto descreve uma manifestação clínica precisa (ex: melena → K921, hematêmese → K920, dispneia → J069, edema agudo pulmão → J810), use esse código em vez do genérico "sem outra especificação"
   - AVC: use I63 (isquêmico) se o texto diz "AVC isquêmico" OU TC sem sangramento; use I61 (hemorrágico) se TC confirma hemorragia; use I64 APENAS se o tipo for verdadeiramente desconhecido (sem TC e sem lateralização)
   - NÃO infira diagnósticos psiquiátricos (F00-F99) a partir de medicamentos de uso contínuo
   - NÃO inclua condições inferidas de medicamentos sem menção explícita no texto — warfarina/anticoagulantes NÃO geram E79 (E79 = gota/purina); INR coletado sem resultado alterado NÃO é um diagnóstico adicional; AAS/aspirina NÃO gera I10 sem diagnóstico explícito; metformina/insulina NÃO geram E11 sem diagnóstico explícito
   - TESTE OBRIGATÓRIO antes de incluir cada CID: "o texto nomeia EXPLICITAMENTE este diagnóstico?" — se a resposta for NÃO (mesmo que seja clinicamente provável), EXCLUA o CID
   - NÃO repita o mesmo grupo CID duas vezes: se o paciente tem hematêmese (K920) E melena (K921), retorne APENAS o subcódigo mais grave como diagnóstico principal — não liste ambos separadamente; se necessário mencionar a segunda manifestação, inclua-a na justificativa do CID principal

2. "termos": lista de 4 a 6 termos de busca em português para procedimentos SIGTAP. Regras para termos:
   - O primeiro DEVE ser "tratamento de [diagnóstico principal COM qualificador anatômico]" (ex: "tratamento hemorragia digestiva alta", "tratamento infarto agudo miocardio", "tratamento pneumonia bacteriana", "tratamento avc isquemico")
   - PRIORIDADE MÁXIMA: se o quadro requer intervenção terapêutica específica, inclua OBRIGATORIAMENTE o termo dessa intervenção:
     • IAM/SCA → "angioplastia coronariana" e/ou "trombolise coronariana"
     • AVC isquêmico → "trombolítico avc isquêmico" e/ou "trombectomia cerebral" (SIGTAP usa "trombolítico", não "trombolise")
     • Hemorragia digestiva → "endoscopia digestiva alta terapeutica"
     • Pneumotórax/derrame → "drenagem torax"
     • Abdome agudo cirúrgico → "laparotomia exploradora"
     • Fratura → "reducao cirurgica fratura [osso]"
   - Os demais termos devem ser procedimentos DIAGNÓSTICOS ou COMPLEMENTARES específicos ao sistema/órgão (ex: "cateterismo cardiaco", "tomografia cranio", "transfusao concentrado hemacias")
   - NUNCA use termos genéricos sem qualificador anatômico (ex: ERRADO: "tratamento hemorragia"; CORRETO: "tratamento hemorragia digestiva alta")
   - NUNCA gere termos para exames de esforço/estresse (ecocardiografia estresse, teste ergometrico) em quadros agudos
   - Use terminologia SUS/SIGTAP (ex: "hemacias" não "eritrócitos", "digestiva" não "gastrointestinal")
3. "aih": texto estruturado em parágrafos para laudo de AIH. Separe os parágrafos com \n\n. Cada parágrafo é texto corrido, sem títulos, sem marcadores.

PARÁGRAFO 1 — APRESENTAÇÃO CLÍNICA (sempre presente):
Modelo: "Internação em caráter de [urgência/eletivo] por [diagnóstico + qualificação clínica], em paciente [contexto sucinto], admitido(a) com [qualificador hemodinâmico] (PA X/X mmHg, FC X bpm, SpO₂ X% em ar ambiente, PAM X mmHg), [outros achados do estado geral: consciência, perfusão, extremidades]."
Regras obrigatórias do P1:
  • Use ABREVIAÇÕES: PA, FC, SpO₂, PAM, GCS — nunca "pressão arterial" ou "frequência cardíaca" por extenso
  • Coloque os valores dos sinais vitais ENTRE PARÊNTESES após o qualificador clínico (ex: "com instabilidade hemodinâmica (PA 89/65 mmHg, FC 113 bpm, SpO₂ 88% em ar ambiente, PAM 64 mmHg)")
  • Inclua PAM se mencionada no texto; inclua o suporte de O₂ junto com SpO₂ (ex: "em ar ambiente", "sob cateter O₂")
  • Inclua outros achados do estado geral de admissão (nível de consciência, perfusão periférica, extremidades, TEC)

PARÁGRAFO 2 — EXAME FÍSICO ESPECÍFICO (inclua SOMENTE se houver achados específicos relevantes ao diagnóstico — ex: toque retal, ausculta pulmonar, déficit neurológico focal, abdome agudo):
Modelo: "Exame físico [com/evidenciando] [achado específico mais relevante ao diagnóstico]."
Regras do P2:
  • Foque no achado mais importante e diagnóstico — NÃO repita sinais vitais nem achados genéricos
  • NÃO repita nenhum achado já descrito no P1 — se o P1 já mencionou "dor epigástrica" e "fezes enegrecidas ao toque retal", NÃO os cite novamente no P2
  • TESTE OBRIGATÓRIO: releia mentalmente o P1 antes de escrever o P2 — se o achado já aparece no P1, não o inclua no P2
  • Se todos os achados relevantes já estão no P1, OMITA o P2 completamente — um P2 repetitivo é PIOR do que omiti-lo

PARÁGRAFO 3 — EXAMES COMPLEMENTARES (inclua SOMENTE se houver VALORES NUMÉRICOS de exames no texto):
Modelo: "Provas diagnósticas realizadas na admissão: hemograma completo (Hb X g/dL; Ht X%; leucócitos X/mm³; plaquetas X/mm³), coagulograma (TP X s; RNI X,X; TTPa X,X s), PCR X mg/L, ureia X mg/dL, creatinina X mg/dL."
Regras obrigatórias do P3:
  • NUNCA liste apenas o nome do exame — inclua SEMPRE o valor numérico e a unidade (ex: "Hb 9,6 g/dL", não "hemoglobina")
  • Se um exame foi solicitado mas o resultado não consta no texto, OMITA-O completamente — ex: "INR colhido" sem valor numérico → NÃO mencionar; "hemograma solicitado" sem resultado → NÃO mencionar; "TC realizada" sem laudo → NÃO mencionar
  • Agrupe em subconjuntos quando pertinente: hemograma, coagulograma, função renal, etc.
  • Unidades corretas: g/dL para hemoglobina, % para hematócrito, /mm³ para leucócitos e plaquetas, s para tempos de coagulação, mg/L para PCR, mg/dL para ureia/creatinina, mmol/L para eletrólitos, U/L para enzimas

PARÁGRAFO 4 — CONDUTAS (sempre presente):
Modelo: "Necessitou de [lista das intervenções EFETIVAMENTE realizadas ou explicitamente solicitadas no texto]."
Regras obrigatórias do P4:
  • Liste APENAS o que está no texto (prescrições, condutas anotadas, procedimentos solicitados)
  • NÃO invente condutas não mencionadas — se não há antibiótico prescrito, não escreva "antibioticoterapia"
  • Use nomes específicos: "inibidor de bomba de prótons EV" (não "medicação endovenosa"), "transfusão de concentrado de hemácias" (não "transfusão sanguínea")
  • Inclua procedimentos planejados se explicitamente mencionados (ex: "avaliação por endoscopia digestiva alta")

PARÁGRAFO 5 — JUSTIFICATIVA (sempre presente):
Modelo: "Quadro clínico [grave/moderado/de risco], com [principal elemento de gravidade clínica], justificando internação hospitalar para [objetivos do tratamento]."
Regras obrigatórias do P5:
  • Foque no RISCO CLÍNICO PRIMÁRIO (ex: "risco iminente de deterioração hemodinâmica", "insuficiência respiratória aguda", "risco de sangramento ativo")
  • NÃO use contexto administrativo como justificativa principal (não mencione limitação terapêutica, DNR, cuidados paliativos como elemento central)

Regras gerais:
- Omita P2 e P3 se não houver dados suficientes — NUNCA invente valores
- NÃO inclua nenhum código CID-10 ou SIGTAP no texto
- OBRIGATÓRIO: use acentuação correta do português (ã, ç, ê, ô, á, é, í, ó, ú, etc.) em todos os textos

Texto clínico:
${anamnese}`

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em codificação médica no SUS brasileiro. ' +
            'REGRA ABSOLUTA: todo texto em português deve usar acentuação correta — ' +
            'internação (não "internacao"), urgência (não "urgencia"), diagnóstico (não "diagnostico"), ' +
            'acidente vascular cerebral isquêmico, administração, avaliação, função, ' +
            'crônico, médico, cardíaco, neurológico, etc. ' +
            'Nunca omita acentos, cedilhas ou til em palavras portuguesas.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const text = completion.choices[0]?.message?.content
    if (!text) {
      return res.status(502).json({ error: 'Resposta vazia da IA' })
    }

    const raw = JSON.parse(text)

    // Normaliza nomes de campos — Llama pode retornar variações como "code", "cid", "codigo"
    const cidsRaw = (raw.cids || raw.diagnoses || raw.diagnosticos || []).map(c => ({
      co_cid: (c.co_cid || c.code || c.cid || c.codigo || '')
        .replace(/\./g, '')
        .toUpperCase()
        .trim(),
      justificativa: c.justificativa || c.justification || c.rationale || c.description || '',
    })).filter(c => c.co_cid)

    // Deduplica por grupo de 3 chars: se o modelo retornar K920 + K921, mantém apenas o primeiro.
    // Isso evita dois cards idênticos na UI quando o paciente tem hematêmese E melena (mesmo grupo K92).
    const seenPrefixes = new Set()
    const cids = cidsRaw.filter(c => {
      const prefix = c.co_cid.slice(0, 3)
      if (seenPrefixes.has(prefix)) return false
      seenPrefixes.add(prefix)
      return true
    })

    // Normaliza separadores de parágrafo — o modelo às vezes usa ". . " (ponto espaço ponto espaço)
    // em vez de "\n\n", especialmente em respostas compactas.
    const aihRaw = raw.aih || ''
    const aih = aihRaw
      .replace(/\.\s*\n\s*\.\s*\n?/g, '.\n\n')                    // ".\n.\n" → ".\n\n"
      .replace(/\.\s+\.\s+(?=[A-ZÁÉÍÓÚÃÕÂÊÎ])/g, '.\n\n')        // ". . P" → ".\n\nP"
      .trim()

    const result = { cids, termos: raw.termos || raw.terms || [], aih }
    return res.status(200).json(result)
  } catch (err) {
    console.error('Erro ao analisar anamnese:', err)
    return res.status(500).json({ error: 'Falha ao processar a análise' })
  }
}
