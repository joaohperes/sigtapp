import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProcedures() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchMeta, setSearchMeta] = useState(null)

  const search = useCallback(async (query, mode = null) => {
    const raw = query?.trim() ?? ''
    // Remove pontos e hífens para detectar e buscar por código formatado (ex: 04.07.02.003-9)
    const q = raw.replace(/[.\-]/g, '')

    const isNumeric = /^\d+$/.test(q)
    const isCode = (mode === 'codigo' && isNumeric) || (!mode && isNumeric)
    const isCid  = (mode === 'cid')    || (!mode && /^[A-Za-z]\d/i.test(q))

    // Modo forçado: 2 chars mínimo; CID auto: 2 chars; texto: 3 chars
    if (q.length < 2 || (q.length < 3 && !isCid && mode === null)) {
      setResults([])
      setError(null)
      setSearchMeta(null)
      return
    }

    setLoading(true)
    setError(null)

    let data, err

    if (isCode) {
      setSearchMeta({ type: 'code' })
      ;({ data, error: err } = await supabase
        .from('procedimentos')
        .select('co_procedimento, no_procedimento, vl_sa, vl_sh, vl_sp, tp_financiamento, no_financiamento, ds_procedimento, qt_dias_perman')
        .ilike('co_procedimento', `${q}%`)
        .limit(200))
    } else if (isCid) {
      ;({ data, error: err } = await supabase.rpc('buscar_por_cid', {
        query: q,
        limite: 200,
      }))
      if (data?.length > 0) {
        setSearchMeta({ type: 'cid', co_cid: data[0].co_cid ?? q.toUpperCase(), no_cid: data[0].no_cid })
      } else {
        setSearchMeta({ type: 'cid', co_cid: q.toUpperCase() })
      }
    } else {
      setSearchMeta({ type: 'name' })
      ;({ data, error: err } = await supabase.rpc('buscar_procedimentos', {
        query: q,
        limite: 200,
      }))
    }

    if (err) {
      setError(err.message)
      setResults([])
    } else {
      setResults(data ?? [])
    }

    setLoading(false)
  }, [])

  return { results, loading, error, search, searchMeta }
}

export function useProcedureByCode(codigo) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!codigo) return

    supabase
      .from('procedimentos')
      .select('*')
      .eq('co_procedimento', codigo)
      .single()
      .then(({ data: row, error: err }) => {
        if (err) setError(err.message)
        else setData(row)
        setLoading(false)
      })
  }, [codigo])

  return { data, loading, error }
}
