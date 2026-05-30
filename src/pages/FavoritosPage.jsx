import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFavoritos } from '../contexts/FavoritosContext'
import { useModoUE } from '../contexts/ModoUEContext'
import { useTheme } from '../contexts/ThemeContext'
import { ProcedureCard, ProcedureRow } from '../components/ProcedureCard'
import { ProcedureSheetContent } from '../components/ProcedureSheetContent'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function FavoritosPage() {
  const { favoritos } = useFavoritos()
  const { modoUE } = useModoUE()
  const { dark } = useTheme()
  const [view, setView] = useState('cards')
  const [sheetProc, setSheetProc] = useState(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={modoUE ? "bg-gradient-to-br from-red-950 via-red-900 to-red-800" : dark ? "bg-gradient-to-br from-[#0A1628] via-[#0D2347] to-[#0F3460]" : "border-b border-border bg-card"}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 fill-amber-400 text-amber-400 shrink-0" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <h1 className={cn("text-xl font-bold", (modoUE || dark) ? "text-white" : "text-foreground")}>Favoritos</h1>
              <span className={cn("text-sm", modoUE ? "text-red-300" : dark ? "text-blue-300" : "text-muted-foreground")}>
                · {favoritos.length} procedimento{favoritos.length !== 1 ? 's' : ''}
              </span>
            </div>
            {favoritos.length > 0 && (
              <div className={cn("flex items-center gap-1 rounded-lg border p-1", (modoUE || dark) ? "border-white/20 bg-white/10" : "border-border bg-secondary")}>
                {['cards', 'lista'].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      'rounded px-3 py-1 text-xs font-medium transition capitalize',
                      view === v
                        ? (modoUE || dark) ? 'bg-white text-slate-800 shadow-sm' : 'bg-card text-foreground shadow-sm'
                        : (modoUE || dark) ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {v === 'cards' ? 'Cards' : 'Lista'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {favoritos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <svg className="h-12 w-12 text-slate-200" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <p className="text-sm text-slate-500">Nenhum procedimento favoritado ainda.</p>
            <Link to="/" className="text-sm text-blue-600 hover:underline">
              ← Voltar ao início
            </Link>
          </div>
        ) : view === 'cards' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favoritos.map(p => (
              <ProcedureCard key={p.co_procedimento} procedure={p} onSelect={setSheetProc} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {favoritos.map(p => (
              <ProcedureRow key={p.co_procedimento} procedure={p} onSelect={setSheetProc} />
            ))}
          </div>
        )}
      </main>

      <Sheet open={!!sheetProc} onOpenChange={open => !open && setSheetProc(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {sheetProc && <ProcedureSheetContent procedure={sheetProc} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
