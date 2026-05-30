import { StrictMode } from 'react'

// Desregistra todos os service workers antigos para forçar atualização
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister())
  })
}

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { FavoritosProvider } from './contexts/FavoritosContext'
import { ModoUEProvider } from './contexts/ModoUEContext'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <FavoritosProvider>
        <ModoUEProvider>
          <TooltipProvider delayDuration={300}>
            <App />
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
        </ModoUEProvider>
      </FavoritosProvider>
    </ThemeProvider>
  </StrictMode>,
)
