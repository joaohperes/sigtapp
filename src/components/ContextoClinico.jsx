import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { cn } from '@/lib/utils'
import { CONTEXTO_CLINICO } from '../data/contexto-clinico'

const cacheReg = new Map()
const cacheCor = new Map()

function ProcReg({ p, dark }) {
  const navigate = useNavigate()
  const total = (parseFloat(p.vl_sh) || 0) + (parseFloat(p.vl_sa) || 0) + (parseFloat(p.vl_sp) || 0)
  const grupo = p.grupo === '03' ? 'Clínico' : 'Cirúrgico'
  const corGrupo = p.grupo === '03' ? 'text-emerald-500' : 'text-orange-400'

  function copiar(e) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(p.co_procedimento)
    toast.success('Código copiado!', { duration: 1500 })
  }

  return (
    <Link
      to={`/procedimento/${p.co_procedimento}`}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-secondary"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-[10px] text-muted-foreground">{formatCodigo(p.co_procedimento)}</span>
          <span className={cn('text-[10px] font-semibold', corGrupo)}>{grupo}</span>
          <button
            onClick={copiar}
            title="Copiar código"
            className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <p className="text-xs font-medium text-foreground leading-snug">{p.no_procedimento}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            navigate(`/calculadora?add=${p.co_procedimento}`)
            toast.success('Procedimento adicionado à calculadora', { duration: 1500 })
          }}
          title="Montar AIH na calculadora com este procedimento"
          className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500 transition whitespace-nowrap"
        >
          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          AIH
        </button>
        <p className="text-xs font-bold text-emerald-500 tabular-nums">{formatBRL(total)}</p>
      </div>
    </Link>
  )
}

const CLINICOS_PREVIEW = 5

// Renderiza lista de procedimentos com clínicos em destaque e cirúrgicos colapsáveis
// somente se há clínicos. Se só há cirúrgicos, exibe todos diretamente.
function ProcList({ procs, dark, labelClinicos = 'Clínicos — use para regulação' }) {
  const [cirurgicosAbertos, setCirurgicosAbertos] = useState(false)
  const [clinicosExpandidos, setClinicosExpandidos] = useState(false)

  // Prioriza procedimentos com valor > 0, depois os demais
  const clinicosRaw = procs.filter(p => p.grupo === '03')
  const clinicosComValor = clinicosRaw.filter(p => (parseFloat(p.vl_sh) || 0) + (parseFloat(p.vl_sa) || 0) + (parseFloat(p.vl_sp) || 0) > 0)
  const clinicosSemValor = clinicosRaw.filter(p => (parseFloat(p.vl_sh) || 0) + (parseFloat(p.vl_sa) || 0) + (parseFloat(p.vl_sp) || 0) === 0)
  // Mostra primeiro os com valor, depois sem valor — limita preview ao total
  const clinicos = [...clinicosComValor, ...clinicosSemValor]
  const clinicosVisiveis = clinicosExpandidos ? clinicos : clinicos.slice(0, CLINICOS_PREVIEW)
  const temMaisClinicos = clinicos.length > CLINICOS_PREVIEW

  const cirurgicos = procs.filter(p => p.grupo === '04')
  const soCirurgicos = clinicos.length === 0 && cirurgicos.length > 0

  return (
    <div className="space-y-1.5">
      {/* Só cirúrgicos — mostra todos diretamente com aviso */}
      {soCirurgicos && (
        <>
          <p className="text-[10px] text-muted-foreground mb-1">
            Nenhum código clínico disponível — apenas procedimentos cirúrgicos:
          </p>
          {cirurgicos.map(p => <ProcReg key={p.co_procedimento} p={p} dark={dark} />)}
        </>
      )}

      {/* Tem clínicos — destaca e colapsa cirúrgicos */}
      {!soCirurgicos && (
        <>
          {clinicos.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {labelClinicos}
              </p>
              {clinicosVisiveis.map(p => <ProcReg key={p.co_procedimento} p={p} dark={dark} />)}
              {temMaisClinicos && (
                <button
                  onClick={() => setClinicosExpandidos(v => !v)}
                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition"
                >
                  {clinicosExpandidos
                    ? 'Ver menos'
                    : `Ver mais ${clinicos.length - CLINICOS_PREVIEW} procedimentos`}
                </button>
              )}
            </div>
          )}
          {cirurgicos.length > 0 && (
            <div className={clinicos.length > 0 ? 'pt-2 border-t border-border/40' : ''}>
              <button
                onClick={() => setCirurgicosAbertos(v => !v)}
                className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition"
              >
                <svg className={cn('h-3 w-3 transition-transform', cirurgicosAbertos ? 'rotate-90' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {cirurgicosAbertos ? 'Ocultar' : 'Ver'} procedimentos cirúrgicos ({cirurgicos.length})
              </button>
              {cirurgicosAbertos && (
                <div className="mt-1.5 space-y-1.5">
                  {cirurgicos.map(p => <ProcReg key={p.co_procedimento} p={p} dark={dark} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProcRegList({ procs, dark }) {
  return (
    <div className="space-y-2">
      <ProcList procs={procs} dark={dark} />
      <p className="text-[10px] text-muted-foreground/60 pt-1">
        Dados da tabela SIGTAP · clique para ver detalhes do procedimento
      </p>
    </div>
  )
}

function CorrelatosColapsaveis({ correlatos, dark }) {
  const [aberto, setAberto] = useState(true)
  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <button
        onClick={() => setAberto(v => !v)}
        className="flex items-center gap-1.5 text-[10px] font-medium text-amber-500/80 hover:text-amber-500 transition"
      >
        <svg className={cn('h-3 w-3 transition-transform', aberto ? 'rotate-90' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {aberto ? 'Ocultar' : `Ver ${correlatos.length} códigos alternativos do mesmo sistema`}
      </button>
      {aberto && (
        <div className="mt-2 space-y-1.5">
          {correlatos.map(p => (
            <div key={p.co_procedimento}>
              <ProcReg p={p} dark={dark} />
              {p.co_cid_ref && (
                <p className="ml-3 text-[10px] text-muted-foreground/50">
                  via <span className="font-mono">{p.co_cid_ref}</span> · {p.no_cid_ref}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GrupoCorrelato({ grupo, dark }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-xs font-bold shrink-0', dark ? 'text-amber-400' : 'text-amber-600')}>{grupo.co_cid}</span>
          <span className="text-xs font-medium text-foreground leading-snug">{grupo.no_cid}</span>
        </div>
        {grupo.justificativa && (
          <p className="mt-0.5 text-[10px] text-muted-foreground italic">{grupo.justificativa}</p>
        )}
      </div>
      <ProcList procs={grupo.procs} dark={dark} labelClinicos="Clínico alternativo para regulação" />
    </div>
  )
}

export function ContextoClinico({ cid, autoOpen = false }) {
  const { dark } = useTheme()
  const [aberto, setAberto] = useState(autoOpen)
  const [aba, setAba] = useState('regulacao') // 'regulacao' | 'clinico'

  // Regulação state
  const [procsReg, setProcsReg] = useState(null)
  const [loadingReg, setLoadingReg] = useState(false)
  const [erroReg, setErroReg] = useState(null)
  const buscandoRegRef = useRef(false)

  // Correlatos state
  const [correlatos, setCorrelatos] = useState(null)
  const buscandoCorRef = useRef(false)

  // Contexto clínico curado
  const cidKey = cid.co_cid?.trim()
  const ctxCurado = CONTEXTO_CLINICO[cidKey] || null

  useEffect(() => {
    if (autoOpen) {
      setAberto(true)
      buscarReg()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function buscarReg() {
    const key = cid.co_cid?.trim()
    if (cacheReg.has(key)) { setProcsReg(cacheReg.get(key)); return }
    if (buscandoRegRef.current) return
    buscandoRegRef.current = true
    setLoadingReg(true)
    setErroReg(null)
    try {
      const { data, error } = await supabase.rpc('procedimentos_por_cid_regulacao', { p_co_cid: key })
      if (error) throw new Error(error.message)
      cacheReg.set(key, data || [])
      setProcsReg(data || [])
    } catch (err) {
      setErroReg(err.message)
    } finally {
      setLoadingReg(false)
      buscandoRegRef.current = false
    }
    // Busca correlatos em paralelo
    buscarCorrelatos()
  }

  async function buscarCorrelatos() {
    const key = cid.co_cid?.trim()
    if (cacheCor.has(key)) { setCorrelatos(cacheCor.get(key)); return }
    if (buscandoCorRef.current) return
    buscandoCorRef.current = true
    try {
      const { data, error } = await supabase.rpc('cids_correlatos_clinicos', { p_co_cid: key })
      if (error) throw new Error(error.message)
      // Deduplica por procedimento
      const seen = new Map()
      for (const row of (data || [])) {
        if (seen.has(row.co_procedimento)) continue
        const vl_sh = parseFloat(row.vl_sh) || 0
        const vl_sa = parseFloat(row.vl_sa) || 0
        const vl_sp = parseFloat(row.vl_sp) || 0
        // Ignora procedimentos sem valor (CAPS, residência terapêutica, etc.)
        if (vl_sh + vl_sa + vl_sp === 0) continue
        seen.set(row.co_procedimento, {
          co_procedimento: row.co_procedimento,
          no_procedimento: row.no_procedimento,
          grupo: '03',
          vl_sh, vl_sa, vl_sp,
          co_cid_ref: row.co_cid_correlato,
          no_cid_ref: row.no_cid_correlato,
        })
      }
      const resultado = Array.from(seen.values())
      cacheCor.set(key, resultado)
      setCorrelatos(resultado)
    } catch {
      setCorrelatos([])
    } finally {
      buscandoCorRef.current = false
    }
  }

  async function toggle() {
    if (aberto) { setAberto(false); return }
    setAberto(true)
    buscarReg()
  }

  function mudarAba(novaAba) {
    setAba(novaAba)
    if (novaAba === 'regulacao' && !procsReg && !loadingReg) buscarReg()
  }

  return (
    <div>
      {/* Botão trigger */}
      <button
        onClick={toggle}
        title="Ver procedimentos SIGTAP por contexto clínico e regulação"
        className={cn(
          'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition whitespace-nowrap',
          aberto
            ? 'border-foreground/30 bg-foreground/5 text-foreground'
            : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
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
          'border-border bg-card'
        )}>
          {/* Abas */}
          <div className="flex border-b border-border">
            <button
              onClick={() => mudarAba('regulacao')}
              className={cn(
                'flex-1 px-4 py-2.5 text-xs font-medium transition',
                aba === 'regulacao'
                  ? 'text-foreground border-b border-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Regulação · SIGTAP
            </button>
            {ctxCurado && (
              <button
                onClick={() => mudarAba('clinico')}
                className={cn(
                  'flex-1 px-4 py-2.5 text-xs font-medium transition',
                  aba === 'clinico'
                    ? 'text-foreground border-b border-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Contexto clínico
              </button>
            )}
          </div>

          {/* Aba Regulação */}
          {aba === 'regulacao' && (
            <div className="p-4">
              {loadingReg && (
                <div className="flex items-center gap-2 py-2">
                  <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-xs text-muted-foreground">Buscando na tabela SIGTAP...</span>
                </div>
              )}
              {erroReg && <p className="text-xs text-red-400">{erroReg}</p>}
              {procsReg && procsReg.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum procedimento grupo 03/04 vinculado a este CID na tabela SIGTAP.</p>
              )}
              {procsReg && procsReg.length > 0 && (
                <ProcRegList procs={procsReg} dark={dark} />
              )}

              {/* CIDs correlatos com procedimentos adicionais */}
              {correlatos === null && !loadingReg && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  <svg className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-[10px] text-muted-foreground">Buscando códigos alternativos para regulação...</span>
                </div>
              )}

              {/* Dica especial para Sepse */}
              {correlatos !== null && /^A41/i.test(cid.co_cid?.trim()) && (
                <div className={cn('mt-4 pt-4 border-t', dark ? 'border-[rgba(255,255,255,0.06)]' : 'border-border')}>
                  <div className={cn('rounded-lg p-3', dark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200')}>
                    <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
                      Dica para regulação de Sepse
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Para sepse, considere usar o <strong className="text-foreground">CID do foco infeccioso</strong> com seu código de tratamento específico:
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {[
                        { cid: 'J189', label: 'Foco pulmonar → Tratamento de pneumonias' },
                        { cid: 'N390', label: 'Foco urinário → Tratamento de doenças renais' },
                        { cid: 'K659', label: 'Foco abdominal → Tratamento de doenças do peritônio' },
                        { cid: 'L089', label: 'Foco cutâneo → Tratamento de infecções de pele' },
                      ].map(item => (
                        <p key={item.cid} className="text-[10px] text-muted-foreground">
                          <span className="font-mono font-semibold text-foreground">{item.cid}</span>
                          {' · '}{item.label}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {correlatos && correlatos.length > 0 && !/^A41/i.test(cid.co_cid?.trim()) && (
                <CorrelatosColapsaveis correlatos={correlatos} dark={dark} />
              )}
            </div>
          )}

          {/* Aba Contexto clínico curado */}
          {aba === 'clinico' && ctxCurado && (
            <div className="p-4 space-y-3">
              {/* Nota clínica */}
              <p className="text-xs text-foreground leading-relaxed">{ctxCurado.nota}</p>

              {/* CIDs alternativos */}
              {ctxCurado.cids_alt?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    CIDs alternativos para regulação
                  </p>
                  <div className="space-y-1.5">
                    {ctxCurado.cids_alt.map(alt => (
                      <Link
                        key={alt.co_cid}
                        to={`/?q=${encodeURIComponent(alt.co_cid)}&ctx=1`}
                        className="flex items-start gap-2 rounded-lg px-2.5 py-2 transition hover:bg-secondary group"
                      >
                        <span className="font-mono text-xs font-bold text-foreground shrink-0">{alt.co_cid}</span>
                        <div className="min-w-0">
                          <span className="text-xs text-foreground">{alt.label}</span>
                          {alt.motivo && (
                            <p className="text-[10px] text-muted-foreground leading-snug">{alt.motivo}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Dica de regulação */}
              {ctxCurado.dica_regulacao && (
                <div className={cn(
                  'rounded-lg border p-2.5',
                  dark ? 'border-border bg-secondary/30' : 'border-border bg-secondary/50'
                )}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Dica SIGTAP
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{ctxCurado.dica_regulacao}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
