import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useModoUE } from '../contexts/ModoUEContext'
import { useFavoritos } from '../contexts/FavoritosContext'
import { useTheme } from '../contexts/ThemeContext'
import { CommandMenu } from './CommandMenu'
import { cn } from '@/lib/utils'

function NavLink({ to, label, active, modoUE, dark, badge }) {
  return (
    <Link
      to={to}
      className={cn(
        'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
        active
          ? modoUE
            ? 'bg-red-800 text-white'
            : dark
              ? 'bg-[rgba(56,189,248,0.12)] text-[#38bdf8] border border-[rgba(56,189,248,0.25)]'
              : 'bg-blue-50 text-blue-700'
          : modoUE
            ? 'text-red-200 hover:bg-red-800 hover:text-white'
            : dark
              ? 'text-[#8896a8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e8edf5]'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      )}
    >
      {label}
      {badge != null && (
        <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-900">
          {badge}
        </span>
      )}
    </Link>
  )
}

export function AppNav() {
  const { modoUE, toggleModoUE } = useModoUE()
  const { favoritos } = useFavoritos()
  const { dark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className={cn(
      'sticky top-0 z-40 border-b transition-colors',
      modoUE
        ? 'border-red-800/80 bg-red-900/95 backdrop-blur-md'
        : dark
          ? 'border-[rgba(255,255,255,0.08)] bg-[#0a0e1a]/95 backdrop-blur-md'
          : 'border-slate-200/70 bg-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.04)]'
    )}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate('/', { state: { reset: Date.now() } })}
          className={cn(
            'text-xl font-bold tracking-widest transition font-display',
            modoUE ? 'text-white' : dark ? 'text-[#e8edf5]' : 'text-slate-900'
          )}
          style={{ letterSpacing: '0.12em' }}
        >
          SIGTAPP
        </button>

        <div className="mx-3 h-5 w-px bg-current opacity-20" />

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          <NavLink to="/" label="Busca" active={location.pathname === '/'} modoUE={modoUE} dark={dark} />
          <NavLink to="/anamnese" label="Anamnese IA" active={location.pathname === '/anamnese'} modoUE={modoUE} dark={dark} />
          <NavLink to="/calculadora" label="Calculadora" active={location.pathname === '/calculadora'} modoUE={modoUE} dark={dark} />
          <NavLink
            to="/favoritos"
            label="Favoritos"
            active={location.pathname === '/favoritos'}
            modoUE={modoUE}
            dark={dark}
            badge={favoritos.length > 0 ? favoritos.length : null}
          />
          <NavLink to="/hro" label="PS HRO" active={location.pathname === '/hro'} modoUE={modoUE} dark={dark} badge="HRO" />
        </div>

        <div className="flex-1" />

        {/* Command palette trigger */}
        {!modoUE && <CommandMenu />}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg border transition',
            modoUE
              ? 'border-red-700 text-red-200 hover:bg-red-800'
              : dark
                ? 'border-[rgba(255,255,255,0.1)] bg-[#1a2236] text-[#8896a8] hover:border-[rgba(56,189,248,0.4)] hover:text-[#38bdf8]'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
          )}
        >
          {dark ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Modo emergência toggle */}
        <button
          onClick={toggleModoUE}
          title="Filtrar somente grupos clínicos e cirúrgicos (03, 04)"
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
            modoUE
              ? 'border-red-500/50 bg-red-700 text-white hover:bg-red-600'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
          )}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {modoUE ? 'Emergência ativo' : 'Modo emergência'}
        </button>
      </div>
    </nav>
  )
}
