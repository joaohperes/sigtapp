import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import { formatBRL, formatCodigo } from '../utils/formatters'
import { cn } from '@/lib/utils'

const cacheReg = new Map()
const cacheCor = new Map()
const cacheIA = new Map()

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

function ProcList({ procs, dark, labelClinicos = 'Clínicos — use para regulação' }) {
  const [cirurgicosAbertos, setCirurgicosAbertos] = useState(false)
  const [clinicosExpandidos, setClinicosExpandidos] = useState(false)

  const clinicosRaw = procs.filter(p => p.grupo === '03')
  const clinicosComValor = clinicosRaw.filter(p => (parseFloat(p.vl_sh) || 0) + (parseFloat(p.vl_sa) || 0) + (parseFloat(p.vl_sp) || 0) > 0)
  const clinicosSemValor = clinicosRaw.filter(p => (parseFloat(p.vl_sh) || 0) + (parseFloat(p.vl_sa) || 0) + (parseFloat(p.vl_sp) || 0) === 0)
  const clinicos = [...clinicosComValor, ...clinicosSemValor]
  const clinicosVisiveis = clinicosExpandidos ? clinicos : clinicos.slice(0, CLINICOS_PREVIEW)
  const temMaisClinicos = clinicos.length > CLINICOS_PREVIEW

  const cirurgicos = procs.filter(p => p.grupo === '04')
  const soCirurgicos = clinicos.length === 0 && cirurgicos.length > 0

  return (
    <div className="space-y-1.5">
      {soCirurgicos && (
        <>
          <p className="text-[10px] text-muted-foreground mb-1">
            Nenhum código clínico disponível — apenas procedimentos cirúrgicos:
          </p>
          {cirurgicos.map(p => <ProcReg key={p.co_procedimento} p={p} dark={dark} />)}
        </>
      )}
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
                  {clinicosExpandidos ? 'Ver menos' : `Ver mais ${clinicos.length - CLINICOS_PREVIEW} procedimentos`}
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

// Procedimento sugerido pela IA já casado com um código SIGTAP real.
function ProcIASigtap({ p }) {
  const navigate = useNavigate()
  const s = p.sigtap
  const total = (parseFloat(s.vl_sh) || 0) + (parseFloat(s.vl_sa) || 0) + (parseFloat(s.vl_sp) || 0)

  return (
    <Link
      to={`/procedimento/${s.co_procedimento}`}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-secondary"
    >
      <span className={cn(
        'h-1.5 w-1.5 rounded-full shrink-0',
        p.grupo === 'cirúrgico' ? 'bg-orange-400' : p.grupo === 'terapêutico' ? 'bg-emerald-400' : 'bg-foreground/40'
      )} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-[10px] text-muted-foreground">{formatCodigo(s.co_procedimento)}</span>
        </div>
        <p className="text-xs font-medium text-foreground leading-snug">{s.no_procedimento_sigtap}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            navigate(`/calculadora?add=${s.co_procedimento}`)
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
        {total > 0 && <p className="text-xs font-bold text-emerald-500 tabular-nums">{formatBRL(total)}</p>}
      </div>
    </Link>
  )
}

// Procedimento sugerido pela IA sem código SIGTAP confiável — vira atalho de busca.
function PillIA({ p, onClick }) {
  return (
    <button
      onClick={() => onClick(p.termos_busca?.[0] || p.nome)}
      title={`Buscar no SIGTAP: ${p.termos_busca?.join(', ') || p.nome}`}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
        'border-border bg-secondary text-foreground hover:border-foreground/20 hover:text-foreground'
      )}
    >
      <span className={cn(
        'h-1.5 w-1.5 rounded-full shrink-0',
        p.grupo === 'cirúrgico' ? 'bg-orange-400' : p.grupo === 'terapêutico' ? 'bg-emerald-400' : 'bg-foreground/40'
      )} />
      {p.nome}
      <svg className="h-3 w-3 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    </button>
  )
}

// Renderiza um grupo de procedimentos da IA: os casados viram lista rica (com código),
// os não-casados ficam agrupados como pills de busca.
function ProcsIA({ procs, onBuscar }) {
  const casados = (procs || []).filter((p) => p.sigtap)
  const naoCasados = (procs || []).filter((p) => !p.sigtap)
  return (
    <div className="space-y-1.5">
      {casados.map((p, i) => <ProcIASigtap key={`s-${i}`} p={p} />)}
      {naoCasados.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {naoCasados.map((p, i) => <PillIA key={`p-${i}`} p={p} onClick={onBuscar} />)}
        </div>
      )}
    </div>
  )
}

export function ContextoClinico({ cid, collapsible = false }) {
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(!collapsible)
  const [aba, setAba] = useState('regulacao') // 'regulacao' | 'ia'

  // Regulação state
  const [procsReg, setProcsReg] = useState(null)
  const [loadingReg, setLoadingReg] = useState(false)
  const [erroReg, setErroReg] = useState(null)
  const buscandoRegRef = useRef(false)

  // Correlatos state
  const [correlatos, setCorrelatos] = useState(null)
  const buscandoCorRef = useRef(false)

  // IA state
  const [dadosIA, setDadosIA] = useState(null)
  const [loadingIA, setLoadingIA] = useState(false)
  const [erroIA, setErroIA] = useState(null)
  const buscandoIARef = useRef(false)

  useEffect(() => {
    if (!collapsible) buscarReg()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    if (aberto) { setAberto(false); return }
    setAberto(true)
    if (!procsReg && !loadingReg) buscarReg()
  }

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
      const seen = new Map()
      for (const row of (data || [])) {
        if (seen.has(row.co_procedimento)) continue
        const vl_sh = parseFloat(row.vl_sh) || 0
        const vl_sa = parseFloat(row.vl_sa) || 0
        const vl_sp = parseFloat(row.vl_sp) || 0
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

  async function buscarIA(regenerar = false) {
    const key = cid.co_cid?.trim()
    if (!regenerar && cacheIA.has(key)) { setDadosIA(cacheIA.get(key)); return }
    if (buscandoIARef.current) return
    buscandoIARef.current = true
    setLoadingIA(true)
    setErroIA(null)
    try {
      const res = await fetch('/api/cid-contexto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ co_cid: key, no_cid: cid.no_cid?.trim(), regenerar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha na API')
      cacheIA.set(key, data)
      setDadosIA(data)
    } catch (err) {
      setErroIA(err.message)
    } finally {
      setLoadingIA(false)
      buscandoIARef.current = false
    }
  }

  function mudarAba(novaAba) {
    setAba(novaAba)
    if (novaAba === 'ia' && !dadosIA && !loadingIA) buscarIA()
  }

  function irParaBusca(termo) {
    navigate(`/procedimentos?q=${encodeURIComponent(termo)}&sc=1`)
  }

  const temIA = dadosIA && (dadosIA.coringas?.length > 0 || dadosIA.cenarios?.length > 0)

  return (
    <div>
      {collapsible && (
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
      )}
      {aberto && <div className={cn('rounded-xl border overflow-hidden mt-2', 'border-border bg-card')}>
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
        <button
          onClick={() => mudarAba('ia')}
          className={cn(
            'flex-1 px-4 py-2.5 text-xs font-medium transition',
            aba === 'ia'
              ? 'text-foreground border-b border-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Contexto clínico · IA
        </button>
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

      {/* Aba IA */}
      {aba === 'ia' && (
        <div className="p-4 space-y-4">
          {loadingIA && (
            <div className="flex items-center gap-2 py-2">
              <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs text-muted-foreground">Consultando IA...</span>
            </div>
          )}
          {erroIA && <p className="text-xs text-red-400">{erroIA}</p>}
          {!loadingIA && !erroIA && !temIA && dadosIA && (
            <p className="text-xs text-muted-foreground">Nenhum procedimento específico identificado para este CID.</p>
          )}
          {temIA && (
            <>
              {dadosIA.coringas?.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Base — presentes na maioria dos casos
                  </p>
                  <ProcsIA procs={dadosIA.coringas} onBuscar={irParaBusca} />
                </div>
              )}
              {dadosIA.cenarios?.map((c, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className={cn('h-px flex-1', dark ? 'bg-[rgba(255,255,255,0.06)]' : 'bg-border')} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">{c.titulo}</span>
                    <div className={cn('h-px flex-1', dark ? 'bg-[rgba(255,255,255,0.06)]' : 'bg-border')} />
                  </div>
                  {c.descricao && <p className="mb-1.5 text-[11px] text-muted-foreground">{c.descricao}</p>}
                  <ProcsIA procs={c.procedimentos} onBuscar={irParaBusca} />
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <p className="text-[10px] text-muted-foreground/60">
                  Sugestões por IA · validadas contra a tabela SIGTAP
                </p>
                <button
                  onClick={() => buscarIA(true)}
                  disabled={loadingIA}
                  title="Gerar novamente com a IA"
                  className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 hover:text-foreground transition disabled:opacity-40"
                >
                  <svg className={cn('h-3 w-3', loadingIA && 'animate-spin')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerar
                </button>
              </div>
            </>
          )}
        </div>
      )}
      </div>}
    </div>
  )
}
