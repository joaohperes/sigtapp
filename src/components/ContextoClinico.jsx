import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { cn } from '@/lib/utils'

const cache = new Map()

function PillProcedimento({ p, dark, onClick }) {
  return (
    <button
      onClick={() => onClick(p.termos_busca?.[0] || p.nome)}
      title={`Buscar: ${p.termos_busca?.join(', ') || p.nome}`}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
        dark
          ? 'border-[rgba(255,255,255,0.1)] bg-[#1a2236] text-[#e8edf5] hover:border-[rgba(56,189,248,0.4)] hover:text-[#38bdf8]'
          : 'border-border bg-secondary text-foreground hover:border-primary/40 hover:text-primary'
      )}
    >
      <span className={cn(
        'h-1.5 w-1.5 rounded-full shrink-0',
        p.grupo === 'cirúrgico' ? 'bg-[#fb923c]' : p.grupo === 'terapêutico' ? 'bg-[#34d399]' : 'bg-[#38bdf8]'
      )} />
      {p.nome}
    </button>
  )
}

export function ContextoClinico({ cid, autoOpen = false }) {
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(autoOpen)
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const buscandoRef = useRef(false)

  // Se autoOpen, busca imediatamente na montagem
  useEffect(() => {
    if (autoOpen) buscar()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function buscar() {
    const key = cid.co_cid?.trim()
    if (cache.has(key)) { setDados(cache.get(key)); return }
    if (buscandoRef.current) return
    buscandoRef.current = true
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch('/api/cid-contexto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ co_cid: key, no_cid: cid.no_cid?.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha na API')
      cache.set(key, data)
      setDados(data)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
      buscandoRef.current = false
    }
  }

  async function toggle() {
    if (aberto) { setAberto(false); return }
    setAberto(true)
    await buscar()
  }

  function irParaBusca(termo) {
    navigate(`/?q=${encodeURIComponent(termo)}&sc=1`)
  }

  const temConteudo = dados && (dados.coringas?.length > 0 || dados.cenarios?.length > 0)

  return (
    <div>
      {/* Botão trigger */}
      <button
        onClick={toggle}
        title="Ver procedimentos SIGTAP por contexto clínico"
        className={cn(
          'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition whitespace-nowrap',
          aberto
            ? dark
              ? 'border-[rgba(56,189,248,0.4)] bg-[rgba(56,189,248,0.1)] text-[#38bdf8]'
              : 'border-primary/30 bg-primary/10 text-primary'
            : dark
              ? 'border-[rgba(255,255,255,0.1)] text-muted-foreground hover:border-[rgba(56,189,248,0.3)] hover:text-[#38bdf8]'
              : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
        )}
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Contexto
      </button>

      {/* Painel inline */}
      {aberto && (
        <div className={cn(
          'mt-2 rounded-xl border overflow-hidden',
          dark ? 'border-[rgba(56,189,248,0.15)] bg-[#111827]' : 'border-primary/15 bg-card'
        )}>
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3">
              <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs text-muted-foreground">Consultando IA...</span>
            </div>
          )}

          {erro && (
            <p className="px-4 py-3 text-xs text-red-400">{erro}</p>
          )}

          {!loading && !erro && !temConteudo && dados && (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              Nenhum procedimento específico identificado para este CID.
            </p>
          )}

          {temConteudo && (
            <div className="p-4 space-y-4">
              {/* Coringas */}
              {dados.coringas?.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Base — presentes na maioria dos casos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {dados.coringas.map((p, i) => (
                      <PillProcedimento key={i} p={p} dark={dark} onClick={irParaBusca} />
                    ))}
                  </div>
                </div>
              )}

              {/* Cenários */}
              {dados.cenarios?.map((c, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className={cn('h-px flex-1', dark ? 'bg-[rgba(255,255,255,0.06)]' : 'bg-border')} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      {c.titulo}
                    </span>
                    <div className={cn('h-px flex-1', dark ? 'bg-[rgba(255,255,255,0.06)]' : 'bg-border')} />
                  </div>
                  {c.descricao && (
                    <p className="mb-1.5 text-[11px] text-muted-foreground">{c.descricao}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {c.procedimentos?.map((p, j) => (
                      <PillProcedimento key={j} p={p} dark={dark} onClick={irParaBusca} />
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-muted-foreground/60 border-t border-border pt-2">
                Sugestões por IA · clique para buscar no SIGTAP
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
