import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { gruposDeSinonimos } from '../data/sinonimos'
import { CORINGAS_CID } from '../data/coringas'

// CIDs dos diagnósticos frequentes do app — sobem ao topo da busca quando aparecem.
// Filtra valores inválidos: CORINGAS_CID inclui itens { break: true } (separadores
// de layout) sem co_cid, que viravam `undefined` → `null` no array e quebravam
// a ordenação por prioritários no Postgres (= ANY com null degenera).
const CIDS_PRIORITARIOS = CORINGAS_CID.map(c => c.co_cid).filter(Boolean)

// Palavras irrelevantes para a busca
const STOPWORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'em', 'por', 'com', 'sem', 'ao', 'na', 'no'])

function palavrasSignificativas(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
}

export function useCidSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null) // { expanded, substituicoes }
  const [sugestoes, setSugestoes] = useState([]) // vizinhos quando código não existe

  // Busca categorias (3 chars) do mesmo prefixo de 2 caracteres e ordena por
  // proximidade numérica ao código pedido. Ex: C42 (inexistente) → C41, C43, C40…
  // Resolve becos sem saída quando o usuário digita um código realocado/excluído
  // da CID-10 (caso real: osteossarcoma buscado como C42, que não existe).
  const buscarVizinhos = useCallback(async (code) => {
    if (code.length < 3) return []
    const prefixo2 = code.slice(0, 2)
    const alvo = parseInt(code.slice(1, 3), 10)
    if (Number.isNaN(alvo)) return []

    const { data } = await supabase
      .from('cid')
      .select('co_cid, no_cid, tp_sexo')
      .ilike('co_cid', `${prefixo2}_`) // _ = exatamente 1 char → categorias de 3 chars
      .order('co_cid')
    if (!data) return []

    return data
      .map(c => ({ ...c, _dist: Math.abs(parseInt(c.co_cid.slice(1, 3), 10) - alvo) }))
      .sort((a, b) => a._dist - b._dist || a.co_cid.localeCompare(b.co_cid))
      .slice(0, 6)
  }, [])

  const search = useCallback(async (query) => {
    const q = query?.trim() ?? ''
    setSugestoes([])

    if (q.length < 2) {
      setResults([])
      setMeta(null)
      return
    }

    setLoading(true)
    setError(null)

    // Detecta código CID: letra + dígitos (com ou sem ponto), ex: I500, A41.9, J18
    const isCidCode = /^[A-Za-z]\d/i.test(q)

    if (isCidCode) {
      setMeta({ original: q, expanded: q, substituicoes: [] })
      const code = q.replace('.', '').toUpperCase()

      // Código de categoria (3 chars, ex: X70, I61): busca exata primeiro
      // Evita expandir para dezenas de subcódigos desnecessários
      if (code.length === 3) {
        const { data, error: err } = await supabase
          .from('cid')
          .select('co_cid, no_cid, tp_sexo')
          .eq('co_cid', code)
          .limit(1)
        if (err) { setError(err.message); setResults([]) }
        else if (data && data.length > 0) { setResults(data); setLoading(false); return }
        // Se não encontrou exato, cai no prefixo abaixo
      }

      const { data, error: err } = await supabase
        .from('cid')
        .select('co_cid, no_cid, tp_sexo')
        .ilike('co_cid', `${code}%`)
        .order('co_cid')
        .limit(50)
      if (err) { setError(err.message); setResults([]) }
      else {
        setResults(data ?? [])
        // Código sem nenhum resultado → oferece vizinhos da mesma faixa.
        if (!data || data.length === 0) setSugestoes(await buscarVizinhos(code))
      }
      setLoading(false)
      return
    }

    setMeta({ original: q })

    // Sinônimos aditivos: grupos de alternativas (OR interno), grupos entre si AND.
    // Filtra grupos cuja palavra-base é stopword (ex: "de", "do") — mas preserva
    // os que carregam sinônimos formais. Aceita termos de 2 chars (pé, mão): a
    // RPC os casa como palavra inteira (\m..\M), então "fratura pe" filtra de
    // fato pelo pé em vez de virar só "fratura" (que trazia 140 resultados).
    const grupos = gruposDeSinonimos(q)
      .filter(g => g[0].length >= 2 && !STOPWORDS.has(g[0]))
    const gruposFinais = grupos.length > 0 ? grupos : [[q]]

    const { data, error: err } = await supabase
      .rpc('search_cid_grupos', { termos_grupos: gruposFinais, prioritarios: CIDS_PRIORITARIOS })

    if (err) {
      setError(err.message)
      setResults([])
    } else {
      setResults(data ?? [])
    }

    setLoading(false)
  }, [])

  return { results, loading, error, meta, sugestoes, search }
}
