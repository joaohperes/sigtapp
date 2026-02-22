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

    let queryBuilder = supabase
      .from('cid')
      .select('co_cid, no_cid, tp_sexo')
      .limit(100)

    // Filtra pela busca expandida completa primeiro, se tiver múltiplas palavras
    // usa AND implícito encadeando .ilike
    if (palavras.length === 0) {
      queryBuilder = queryBuilder.ilike('no_cid', `%${expanded}%`)
    } else {
      for (const palavra of palavras) {
        queryBuilder = queryBuilder.ilike('no_cid', `%${palavra}%`)
      }
    }

    queryBuilder = queryBuilder.order('co_cid')

    const { data, error: err } = await queryBuilder

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
