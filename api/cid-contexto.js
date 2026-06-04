import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { co_cid, no_cid } = req.body ?? {}
  if (!co_cid?.trim()) {
    return res.status(400).json({ error: 'CID não informado' })
  }

  const cidKey = co_cid.trim().toUpperCase()

  // Tenta cache primeiro
  const { data: cached } = await supabase
    .from('cid_contexto_ia')
    .select('payload')
    .eq('co_cid', cidKey)
    .maybeSingle()

  if (cached?.payload) {
    return res.status(200).json(cached.payload)
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada' })
  }

  const client = new Groq({ apiKey })

  const prompt = `Você é um médico intensivista e codificador do SUS com 20 anos de experiência preenchendo AIH (Autorização de Internação Hospitalar) no Brasil.

Para o CID-10 "${co_cid}" — "${no_cid}", liste os PROCEDIMENTOS SIGTAP que um médico colocaria na AIH deste paciente, agrupados por cenário clínico.

REGRAS ABSOLUTAS — o que PODE estar na AIH:
✓ Tratamentos clínicos específicos da condição (ex: "tratamento de pneumonia", "tratamento de septicemia")
✓ Cirurgias e intervenções cirúrgicas (ex: "apendicectomia", "drenagem de empiema")
✓ Ventilação mecânica invasiva ou não invasiva — SÓ quando o quadro requer suporte ventilatório
✓ Diálise/hemodiálise — SÓ quando há IRA ou DRC dialítica no quadro
✓ Transfusão de concentrado de hemácias — SÓ quando há sangramento ativo ou anemia grave
✓ Trombolítico sistêmico — SÓ em TEP maciço, AVC isquêmico, IAM com indicação
✓ Cardioversão elétrica — SÓ em arritmias com instabilidade
✓ Drenagem torácica — SÓ em pneumotórax, hemotórax, empiema
✓ Filtro de veia cava — SÓ em TEP com contraindicação a anticoagulação

PROIBIDO — NUNCA inclua:
✗ Exames laboratoriais (hemograma, gasometria, troponina, PCR, lactato, culturas)
✗ Exames de imagem (raio-X, TC, RNM, ECG, ecocardiograma, USG)
✗ Medicamentos e infusões (antibióticos, anticoagulantes, vasopressores, analgésicos, hidratação)
✗ Monitoramento (oximetria, PVC, débito urinário, sinais vitais)
✗ Suporte nutricional, cateter venoso central isolado, acesso periférico
✗ Procedimentos não relacionados ao CID em questão (ex: diálise para TEP, transfusão para pneumonia sem sangramento)

TESTE ANTES DE INCLUIR cada procedimento: "Este procedimento estaria na AIH de um paciente com ${co_cid} internado por ${no_cid}?" — se a resposta não for "sim, na maioria ou em cenário específico bem definido", EXCLUA.

Retorne APENAS JSON válido:
{
  "cenarios": [
    {
      "titulo": "cenário clínico específico (ex: TEP maciço com instabilidade, AVC isquêmico com trombolítico)",
      "descricao": "uma frase objetiva sobre quando este cenário se aplica",
      "procedimentos": [
        {
          "nome": "nome exato do procedimento SIGTAP",
          "termos_busca": ["termo1 para busca"],
          "grupo": "clínico | cirúrgico | terapêutico"
        }
      ]
    }
  ],
  "coringas": [
    {
      "nome": "procedimento presente em quase todos os casos deste CID",
      "termos_busca": ["termo1"],
      "grupo": "clínico | cirúrgico | terapêutico"
    }
  ]
}

Regras finais:
- "coringas": máximo 3. Apenas procedimentos que aparecem em >80% das AIH deste CID.
- "cenarios": 2 a 3 cenários. Cada um com 2 a 3 procedimentos realmente específicos.
- Se o CID não gera internação hospitalar tipicamente, retorne coringas:[] e cenarios:[].
- Terminologia SUS: "tratamento de" não "manejo de", use nomes que aparecem na tabela SIGTAP.
- Use acentuação correta em português em todos os textos.`

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
      temperature: 0.0,
    })

    const text = completion.choices[0]?.message?.content
    if (!text) return res.status(502).json({ error: 'Resposta vazia da IA' })

    const raw = JSON.parse(text)

    // Filtro pós-geração: remove procedimentos proibidos independente do que o modelo gerou
    const BLOQUEADOS = [
      'monitoriz', 'monitoring', 'acompanhamento', 'suporte clínico', 'suporte geral',
      'suporte nutricional', 'oxigenoterapia', 'oxigenio', 'oxigênio',
      'laboratorial', 'laboratorio', 'eletrocardiograma', 'ecocardiograma',
      'tomografia', 'radiografia', 'raio-x', 'ultrassom', 'ressonância',
      'anticoagulação', 'anticoagulacao', 'anticoagulante',
      'cateter venoso', 'acesso venoso', 'hidratação', 'hidratacao',
      'analgesia', 'sedação', 'sedacao', 'vasopressor',
    ]

    function ehBloqueado(nome) {
      const n = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      return BLOQUEADOS.some(b => n.includes(b.normalize('NFD').replace(/[̀-ͯ]/g, '')))
    }

    function filtrarProcs(procs) {
      return (procs || []).filter(p => !ehBloqueado(p.nome))
    }

    const cenarios = (raw.cenarios || [])
      .map(c => ({ ...c, procedimentos: filtrarProcs(c.procedimentos) }))
      .filter(c => c.procedimentos.length > 0)

    const coringas = filtrarProcs(raw.coringas)

    const resultado = { cenarios, coringas }

    // Salva no cache (fire-and-forget)
    supabase
      .from('cid_contexto_ia')
      .insert({ co_cid: cidKey, payload: resultado })
      .then(() => {})

    return res.status(200).json(resultado)
  } catch (err) {
    console.error('Erro cid-contexto:', err)
    return res.status(500).json({ error: 'Falha ao processar' })
  }
}
