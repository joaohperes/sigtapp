import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

const cache = new Map()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { co_cid } = req.body ?? {}
  if (!co_cid?.trim()) return res.status(400).json({ error: 'CID não informado' })

  const key = co_cid.trim()
  if (cache.has(key)) return res.status(200).json(cache.get(key))

  // Busca procedimentos clínicos (03) do mesmo sistema orgânico
  // que não estão vinculados ao CID original
  const { data, error } = await supabase.rpc('cids_correlatos_clinicos', { p_co_cid: key })

  if (error) {
    console.error('Erro cids_correlatos_clinicos:', error)
    return res.status(500).json({ error: 'Falha ao buscar correlatos' })
  }

  // Agrupa por procedimento (deduplica CIDs diferentes que têm o mesmo código)
  const seen = new Map()
  for (const row of (data || [])) {
    if (seen.has(row.co_procedimento)) continue
    seen.set(row.co_procedimento, {
      co_procedimento: row.co_procedimento,
      no_procedimento: row.no_procedimento,
      grupo: '03',
      vl_sh: parseFloat(row.vl_sh) || 0,
      vl_sa: parseFloat(row.vl_sa) || 0,
      vl_sp: parseFloat(row.vl_sp) || 0,
      // Guarda o CID correlato como referência (para o médico saber qual CID usar)
      co_cid_ref: row.co_cid_correlato,
      no_cid_ref: row.no_cid_correlato,
    })
  }

  const procs = Array.from(seen.values())
  const resposta = { procs }
  cache.set(key, resposta)
  return res.status(200).json(resposta)
}
