import { Component, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DiagnosticoPage } from './pages/DiagnosticoPage'

// Code-splitting: só a landing (Diagnóstico) entra no bundle inicial;
// as demais páginas carregam sob demanda.
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const ProcedureDetail = lazy(() => import('./pages/ProcedureDetail').then(m => ({ default: m.ProcedureDetail })))
const GroupPage = lazy(() => import('./pages/GroupPage').then(m => ({ default: m.GroupPage })))
const CidSearch = lazy(() => import('./pages/CidSearch').then(m => ({ default: m.CidSearch })))
const AnamnesePage = lazy(() => import('./pages/AnamnesePage').then(m => ({ default: m.AnamnesePage })))
const FavoritosPage = lazy(() => import('./pages/FavoritosPage').then(m => ({ default: m.FavoritosPage })))
const CalculadoraPage = lazy(() => import('./pages/CalculadoraPage').then(m => ({ default: m.CalculadoraPage })))
const HroPage = lazy(() => import('./pages/HroPage').then(m => ({ default: m.HroPage })))
const MapaPage = lazy(() => import('./pages/MapaPage').then(m => ({ default: m.MapaPage })))
import { AppNav } from './components/AppNav'
import { Analytics } from '@vercel/analytics/react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm font-medium text-red-600">Algo deu errado ao renderizar esta página.</p>
          <p className="text-xs text-slate-400">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppShell() {
  return (
    <>
      <AppNav />
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
        }>
        <Routes>
          <Route path="/" element={<DiagnosticoPage />} />
          <Route path="/procedimentos" element={<Home />} />
          <Route path="/grupo/:co" element={<GroupPage />} />
          <Route path="/procedimento/:codigo" element={<ProcedureDetail />} />
          <Route path="/cid" element={<CidSearch />} />
          <Route path="/mapa" element={<MapaPage />} />
          <Route path="/anamnese" element={<AnamnesePage />} />
          <Route path="/favoritos" element={<FavoritosPage />} />
          <Route path="/calculadora" element={<CalculadoraPage />} />
          <Route path="/hro" element={<HroPage />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
      <footer className="border-t border-border bg-background py-5 text-center">
        <p className="text-xs text-muted-foreground/60 transition-opacity hover:text-muted-foreground">
          Desenvolvido por{' '}
          <span className="font-medium text-sky-500 dark:text-sky-400">@joaohperes</span>
          {' '}com{' '}
          <img src="/claude-icon.ico" alt="Claude" className="mb-0.5 inline h-3.5 w-3.5 opacity-80" />
          {' '}<span className="font-medium text-orange-500 dark:text-orange-400">Claude</span>
        </p>
      </footer>
      <Analytics />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
