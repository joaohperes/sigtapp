import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cn } from '@/lib/utils'

// Sistemas clínicos = nível 1 do mapa. Cada um aponta para suas faixas de CID
// (prefixos-raiz) — alinhado ao SISTEMAS de relevanciaCid, que o app já usa nas
// pills de busca. Linguagem do médico ("Neurológico"), não "Capítulo IX".
const SISTEMAS_MAPA = [
  { id: 'neuro',     label: 'Neurológico',       prefixos: ['G', 'I6'] },
  { id: 'vascular',  label: 'Vascular',          prefixos: ['I7'] },
  { id: 'cardio',    label: 'Cardiovascular',    prefixos: ['I0', 'I1', 'I2', 'I3', 'I4', 'I5', 'I8', 'I9'] },
  { id: 'resp',      label: 'Respiratório',      prefixos: ['J'] },
  { id: 'digest',    label: 'Digestivo',         prefixos: ['K'] },
  { id: 'geniturin', label: 'Geniturinário',     prefixos: ['N'] },
  { id: 'obstetr',   label: 'Obstétrico',        prefixos: ['O'] },
  { id: 'infecto',   label: 'Infeccioso',        prefixos: ['A', 'B'] },
  { id: 'trauma',    label: 'Trauma',            prefixos: ['S', 'T0', 'T1'] },
  { id: 'osteomusc', label: 'Osteomuscular',     prefixos: ['M'] },
  { id: 'metabol',   label: 'Endócrino/Metab.',  prefixos: ['E'] },
  { id: 'pele',      label: 'Pele',              prefixos: ['L'] },
  { id: 'hemato',    label: 'Hematológico',      prefixos: ['D5', 'D6', 'D7', 'D8'] },
  { id: 'neoplasia', label: 'Neoplasias',        prefixos: ['C', 'D0', 'D1', 'D2', 'D3', 'D4'] },
  { id: 'olho',      label: 'Oftalmo',           prefixos: ['H0', 'H1', 'H2', 'H3', 'H4', 'H5'] },
  { id: 'ouvido',    label: 'Otorrino',          prefixos: ['H6', 'H7', 'H8', 'H9'] },
  { id: 'psiq',      label: 'Psiquiátrico',      prefixos: ['F'] },
  { id: 'perinatal', label: 'Perinatal',         prefixos: ['P'] },
]

function Chevron({ aberto }) {
  return (
    <svg className={cn('h-3.5 w-3.5 shrink-0 transition-transform', aberto && 'rotate-90')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// Nó folha ou ramo. coCid presente = é um CID navegável; tem_filhos = pode expandir.
function NoCid({ co_cid, no_cid, tem_filhos, nivel }) {
  const [aberto, setAberto] = useState(false)
  const [filhos, setFilhos] = useState(null)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!tem_filhos) return
    if (aberto) { setAberto(false); return }
    setAberto(true)
    if (filhos === null) {
      setLoading(true)
      const { data } = await supabase.rpc('cids_mapa_filhos', { p_prefixo: co_cid })
      setFilhos(data || [])
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: `${nivel * 1.25}rem` }}>
        {tem_filhos ? (
          <button onClick={toggle} className="flex items-center gap-2 text-left hover:text-foreground transition min-w-0">
            <Chevron aberto={aberto} />
            <span className="font-mono text-xs font-bold shrink-0 text-foreground">{co_cid}</span>
            <span className="text-xs text-muted-foreground truncate">{no_cid}</span>
          </button>
        ) : (
          <Link to={`/?q=${encodeURIComponent(co_cid)}&ctx=1`} className="flex items-center gap-2 text-left group min-w-0 ml-[1.375rem]">
            <span className="font-mono text-xs font-bold shrink-0 text-foreground group-hover:text-primary transition">{co_cid}</span>
            <span className="text-xs text-muted-foreground truncate group-hover:text-foreground transition">{no_cid}</span>
            <span className="text-[10px] text-muted-foreground/40 group-hover:text-primary transition shrink-0">ver →</span>
          </Link>
        )}
      </div>
      {aberto && (
        <div>
          {loading && <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: `${(nivel + 1) * 1.25 + 1.375}rem` }}><Spinner /></div>}
          {filhos?.map(f => (
            <NoCid key={f.co_cid} {...f} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function SistemaNo({ sistema }) {
  const [aberto, setAberto] = useState(false)
  const [categorias, setCategorias] = useState(null)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (aberto) { setAberto(false); return }
    setAberto(true)
    if (categorias === null) {
      setLoading(true)
      const { data } = await supabase.rpc('cids_mapa_categorias', { p_prefixos: sistema.prefixos })
      setCategorias(data || [])
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={toggle}
        className={cn('flex w-full items-center gap-2 px-3 py-2.5 text-left transition', aberto ? 'bg-secondary' : 'hover:bg-secondary/50')}
      >
        <Chevron aberto={aberto} />
        <span className="text-sm font-medium text-foreground">{sistema.label}</span>
      </button>
      {aberto && (
        <div className="border-t border-border px-2 py-1">
          {loading && <div className="flex items-center gap-2 py-2 pl-4"><Spinner /><span className="text-xs text-muted-foreground">Carregando...</span></div>}
          {categorias?.length === 0 && !loading && (
            <p className="py-2 pl-4 text-xs text-muted-foreground">Nenhum CID com procedimento neste sistema.</p>
          )}
          {categorias?.map(c => (
            <NoCid key={c.co_cid} {...c} nivel={0} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MapaPage() {
  useEffect(() => { document.title = 'SIGTAPP — Mapa de diagnósticos' }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground">Mapa de diagnósticos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Navegue por sistema para encontrar o CID — só os que têm procedimento de regulação. Clique num código para ver a regulação.
          </p>
        </div>
        <div className="space-y-2">
          {SISTEMAS_MAPA.map(s => <SistemaNo key={s.id} sistema={s} />)}
        </div>
      </div>
    </div>
  )
}
