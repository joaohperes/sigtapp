import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { expandirSinonimos } from '../data/sinonimos'

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

  const search = useCallback(async (query) => {
    const q = query?.trim() ?? ''

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
      // Normaliza removendo ponto (I50.0 → I500) e busca por prefixo
      const code = q.replace('.', '').toUpperCase()
      const { data, error: err } = await supabase
        .from('cid')
        .select('co_cid, no_cid, tp_sexo')
        .ilike('co_cid', `${code}%`)
        .order('co_cid')
        .limit(50)
      if (err) { setError(err.message); setResults([]) }
      else setResults(data ?? [])
      setLoading(false)
      return
    }

    const { expanded, substituicoes } = expandirSinonimos(q)
    setMeta({ original: q, expanded, substituicoes })

    const palavras = palavrasSignificativas(expanded)
    const termos = palavras.length > 0 ? palavras : [expanded]

    const { data, error: err } = await supabase
      .rpc('search_cid_unaccent', { search_terms: termos })

    if (err) {
      setError(err.message)
      setResults([])
    } else {
      setResults(data ?? [])
    }

    setLoading(false)
  }, [])

  return { results, loading, error, meta, search }
}
