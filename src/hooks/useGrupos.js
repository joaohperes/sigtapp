import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useGrupos() {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .rpc('listar_grupos')
      .then(({ data }) => {
        setGrupos(data ?? [])
        setLoading(false)
      })
  }, [])

  return { grupos, loading }
}

export function useGrupoProcedimentos(coGrupo, coSubgrupo) {
  const [procedimentos, setProcedimentos] = useState([])
  const [subgrupos, setSubgrupos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!coGrupo) return
    setLoading(true)

    Promise.all([
      supabase.rpc('listar_subgrupos', { p_co_grupo: coGrupo }),
      supabase.rpc('listar_procedimentos_grupo', {
        p_co_grupo: coGrupo,
        p_co_subgrupo: coSubgrupo || null,
        limite: 300,
      }),
    ]).then(([{ data: subs }, { data: procs }]) => {
      setSubgrupos(subs ?? [])
      setProcedimentos(procs ?? [])
      setLoading(false)
    })
  }, [coGrupo, coSubgrupo])

  return { procedimentos, subgrupos, loading }
}
