import { Link, useLocation } from 'react-router-dom'
import { useModoUE } from '../contexts/ModoUEContext'
import { useFavoritos } from '../contexts/FavoritosContext'
import { cn } from '@/lib/utils'

function NavLink({ to, label, active, modoUE, badge }) {
  return (
    <Link
      to={to}
      className={cn(
        'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
        active
          ? modoUE ? 'bg-red-800 text-white' : 'bg-blue-50 text-blue-700'
          : modoUE ? 'text-red-200 hover:bg-red-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
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
  const location = useLocation()

  return (
    <nav className={cn(
      'sticky top-0 z-40 border-b shadow-sm transition-colors',
      modoUE ? 'border-red-800 bg-red-900' : 'border-slate-200 bg-white'
    )}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
        {/* Logo */}
        <Link
          to="/"
          className={cn('text-xl font-bold transition', modoUE ? 'text-white' : 'text-blue-600')}
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em' }}
        >
          SIGTAPP
        </Link>

        <div className="mx-3 h-5 w-px bg-current opacity-20" />

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          <NavLink to="/" label="Busca" active={location.pathname === '/'} modoUE={modoUE} />
          <NavLink to="/anamnese" label="Anamnese IA" active={location.pathname === '/anamnese'} modoUE={modoUE} />
          <NavLink
            to="/favoritos"
            label="Favoritos"
            active={location.pathname === '/favoritos'}
            modoUE={modoUE}
            badge={favoritos.length > 0 ? favoritos.length : null}
          />
        </div>

        <div className="flex-1" />

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
