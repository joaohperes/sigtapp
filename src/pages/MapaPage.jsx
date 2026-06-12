import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cn } from '@/lib/utils'

// Sistemas clínicos = primeira coluna do mapa. Cada um aponta para suas faixas
// de CID (prefixos-raiz) — alinhado ao SISTEMAS de relevanciaCid. Linguagem do
// médico ("Neurológico"), não "Capítulo IX".
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

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// Uma coluna do Miller view. Recebe os itens e qual está selecionado.
// Cada item: { co_cid?, label, no_cid?, tem_filhos?, leaf? }
function Coluna({ titulo, itens, loading, selecionadoId, onSelect, vazioMsg }) {
  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-border last:border-r-0">
      <div className="border-b border-border bg-secondary/40 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{titulo}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-3"><Spinner /></div>
        ) : itens.length === 0 ? (
          <p className="px-3 py-3 text-xs text-muted-foreground">{vazioMsg}</p>
        ) : (
          itens.map((it) => {
            const ativo = it.id === selecionadoId
            return (
              <button
                key={it.id}
                onClick={() => onSelect(it)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left transition border-b border-border/40 last:border-b-0',
                  ativo ? 'bg-primary/10' : 'hover:bg-secondary/60'
                )}
              >
                {it.co_cid && (
                  <span className={cn('font-mono text-xs font-bold shrink-0', ativo ? 'text-primary' : 'text-foreground')}>
                    {it.co_cid}
                  </span>
                )}
                <span className={cn('flex-1 text-xs leading-snug truncate', ativo ? 'text-foreground' : 'text-muted-foreground')}>
                  {it.label}
                </span>
                {(it.tem_filhos || it.leaf) && (
                  <svg className={cn('h-3 w-3 shrink-0', ativo ? 'text-primary' : 'text-muted-foreground/40')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// Painel final: quando se chega a uma folha (CID sem mais filhos), mostra o
// atalho para a Regulação daquele CID.
function PainelCid({ cid }) {
  return (
    <div className="flex w-72 shrink-0 flex-col items-start gap-3 p-4">
      <div>
        <p className="font-mono text-base font-bold text-foreground">{cid.co_cid}</p>
        <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{cid.label}</p>
      </div>
      <Link
        to={`/?q=${encodeURIComponent(cid.co_cid)}&ctx=1`}
        className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20 transition"
      >
        Ver regulação →
      </Link>
    </div>
  )
}

export function MapaPage() {
  useEffect(() => { document.title = 'SIGTAPP — Mapa de diagnósticos' }, [])

  // path = array de seleções, cada uma: { id, co_cid?, label, prefixos? }
  const [path, setPath] = useState([])
  // colunas[i] = { titulo, itens, loading } para o nível i (após cada seleção)
  const [colunas, setColunas] = useState([])
  const [folha, setFolha] = useState(null) // { co_cid, label } quando chega na ponta

  // Coluna 0: sistemas (estática)
  const colSistemas = {
    titulo: 'Sistema',
    itens: SISTEMAS_MAPA.map(s => ({ id: s.id, label: s.label, tem_filhos: true, prefixos: s.prefixos })),
    loading: false,
  }

  async function selecionar(nivel, item) {
    setFolha(null)
    // trunca o caminho até este nível e adiciona a nova seleção
    const novoPath = [...path.slice(0, nivel), item]
    setPath(novoPath)
    // remove colunas além deste nível
    setColunas(prev => prev.slice(0, nivel))

    // É folha? (sem filhos) → mostra painel de regulação
    if (item.co_cid && !item.tem_filhos) {
      setFolha({ co_cid: item.co_cid, label: item.label })
      return
    }

    // carrega a próxima coluna
    setColunas(prev => [...prev.slice(0, nivel), { titulo: '...', itens: [], loading: true }])
    let data
    if (nivel === 0) {
      // selecionou um sistema → categorias
      ;({ data } = await supabase.rpc('cids_mapa_categorias', { p_prefixos: item.prefixos }))
    } else {
      // selecionou categoria/subcategoria → filhos
      ;({ data } = await supabase.rpc('cids_mapa_filhos', { p_prefixo: item.co_cid }))
    }
    const itens = (data || []).map(r => ({
      id: r.co_cid, co_cid: r.co_cid, label: r.no_cid, tem_filhos: r.tem_filhos,
    }))
    const titulo = nivel === 0 ? 'Categoria' : 'Subcategoria'
    setColunas(prev => {
      const copy = prev.slice(0, nivel)
      copy[nivel] = { titulo, itens, loading: false }
      return copy
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-foreground">Mapa de diagnósticos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Navegue por sistema até o CID. Só os que têm procedimento de regulação. Clique num código sem seta para ver a regulação.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex overflow-x-auto" style={{ minHeight: '28rem', maxHeight: '70vh' }}>
            <Coluna
              titulo={colSistemas.titulo}
              itens={colSistemas.itens}
              loading={false}
              selecionadoId={path[0]?.id}
              onSelect={(it) => selecionar(0, it)}
              vazioMsg="—"
            />
            {colunas.map((col, i) => (
              <Coluna
                key={i}
                titulo={col.titulo}
                itens={col.itens}
                loading={col.loading}
                selecionadoId={path[i + 1]?.id}
                onSelect={(it) => selecionar(i + 1, it)}
                vazioMsg="Nenhum CID com procedimento."
              />
            ))}
            {folha && <PainelCid cid={folha} />}
          </div>
        </div>
      </div>
    </div>
  )
}
