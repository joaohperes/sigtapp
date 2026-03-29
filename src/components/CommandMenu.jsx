import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { supabase } from '../lib/supabase'
import { formatCodigo, formatBRL } from '../utils/formatters'
import { GRUPO_MAP } from '../data/grupos'

const NAV_SHORTCUTS = [
  { label: 'Busca de procedimentos', to: '/', icon: SearchIcon },
  { label: 'Calculadora AIH', to: '/calculadora', icon: CalcIcon },
  { label: 'Anamnese IA', to: '/anamnese', icon: BrainIcon },
  { label: 'Favoritos', to: '/favoritos', icon: StarIcon },
]

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CalcIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function ProcIcon({ co_procedimento }) {
  const estilo = GRUPO_MAP[co_procedimento?.slice(0, 2)]
  return (
    <div className={`h-6 w-1 shrink-0 rounded-full ${estilo?.dot ?? 'bg-slate-200'}`} />
  )
}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const navigate = useNavigate()

  // Atalho ⌘K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Busca com debounce
  useEffect(() => {
    if (!open) return
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc('buscar_procedimentos', {
          query: query.trim(),
          limite: 8,
        })
        setResults(data || [])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, open])

  const handleSelect = useCallback((to) => {
    setOpen(false)
    setQuery('')
    setResults([])
    navigate(to)
  }, [navigate])

  function handleOpenChange(v) {
    setOpen(v)
    if (!v) {
      setQuery('')
      setResults([])
    }
  }

  return (
    <>
      {/* Botão na nav para abrir (opcional, via atalho ⌘K) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 transition hover:border-slate-300 hover:bg-white sm:flex"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Busca rápida</span>
        <kbd className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-[540px] [&>button]:hidden">
          <VisuallyHidden.Root asChild>
            <DialogTitle>Busca rápida de procedimentos</DialogTitle>
          </VisuallyHidden.Root>
          <Command shouldFilter={false} className="rounded-xl">
            <CommandInput
              placeholder="Buscar procedimento, código..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {query.trim().length < 2 ? (
                <CommandGroup heading="Navegação rápida">
                  {NAV_SHORTCUTS.map((item) => (
                    <CommandItem
                      key={item.to}
                      value={item.label}
                      onSelect={() => handleSelect(item.to)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : loading ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-400 gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Buscando...
                </div>
              ) : results.length === 0 ? (
                <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
              ) : (
                <CommandGroup heading={`${results.length} resultado${results.length !== 1 ? 's' : ''}`}>
                  {results.map((proc) => {
                    const total = (proc.vl_sa || 0) + (proc.vl_sh || 0) + (proc.vl_sp || 0)
                    return (
                      <CommandItem
                        key={proc.co_procedimento}
                        value={proc.co_procedimento}
                        onSelect={() => handleSelect(`/procedimento/${proc.co_procedimento}`)}
                      >
                        <ProcIcon co_procedimento={proc.co_procedimento} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[10px] text-slate-400">
                            {formatCodigo(proc.co_procedimento)}
                          </p>
                          <p className="truncate text-sm font-medium text-slate-800">
                            {proc.no_procedimento}
                          </p>
                        </div>
                        {total > 0 && (
                          <span className="shrink-0 text-xs font-semibold text-emerald-600">
                            {formatBRL(total)}
                          </span>
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>

            {query.trim().length >= 2 && results.length > 0 && (
              <>
                <CommandSeparator />
                <div className="px-3 py-2">
                  <button
                    onClick={() => {
                      setOpen(false)
                      navigate(`/?q=${encodeURIComponent(query.trim())}`)
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-500 transition hover:bg-slate-50"
                  >
                    Ver todos os resultados para <span className="font-medium text-slate-700">"{query}"</span> →
                  </button>
                </div>
              </>
            )}
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
