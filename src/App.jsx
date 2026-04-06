import { Component } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { ProcedureDetail } from './pages/ProcedureDetail'
import { GroupPage } from './pages/GroupPage'
import { CidSearch } from './pages/CidSearch'
import { AnamnesePage } from './pages/AnamnesePage'
import { FavoritosPage } from './pages/FavoritosPage'
import { CalculadoraPage } from './pages/CalculadoraPage'
import { HroPage } from './pages/HroPage'
import { AppNav } from './components/AppNav'
import { CommandMenu } from './components/CommandMenu'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'

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

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={300}>
        <AppNav />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/grupo/:co" element={<GroupPage />} />
            <Route path="/procedimento/:codigo" element={<ProcedureDetail />} />
            <Route path="/cid" element={<CidSearch />} />
            <Route path="/anamnese" element={<AnamnesePage />} />
            <Route path="/favoritos" element={<FavoritosPage />} />
            <Route path="/calculadora" element={<CalculadoraPage />} />
            <Route path="/hro" element={<HroPage />} />
          </Routes>
        </ErrorBoundary>
        <footer className="border-t border-slate-100 bg-white py-5 text-center">
          <p className="text-xs text-slate-400">
            Desenvolvido por{' '}
            <span className="font-medium text-blue-400">@joaohperes</span>
            {' '}com{' '}
            <img src="/claude-icon.ico" alt="Claude" className="mb-0.5 inline h-3.5 w-3.5" />
            {' '}<span className="font-medium text-orange-400">Claude</span>
          </p>
        </footer>
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </BrowserRouter>
  )
}
