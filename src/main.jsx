import { StrictMode } from 'react'

// Desregistra qualquer service worker antigo e apaga seus caches — o app não
// usa mais PWA, e SW remanescente servia bundle JS desatualizado após deploy.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister())
  })
}
if ('caches' in window) {
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
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
