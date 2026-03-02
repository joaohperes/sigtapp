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
