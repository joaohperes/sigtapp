import { StrictMode } from 'react'

// Desregistra qualquer service worker antigo e apaga seus caches — o app não
// usa mais PWA, e SW remanescente servia bundle JS desatualizado após deploy.
// Se de fato havia SW/cache, recarrega UMA vez para pegar o bundle novo já nesta
// visita (sessionStorage evita loop). A defesa principal é o /sw.js suicida; isto
// é a rede de segurança para quem chega sem o SW interceptando o próprio main.jsx.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(async (regs) => {
    if (regs.length === 0) return
    await Promise.all(regs.map((r) => r.unregister()))
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    if (!sessionStorage.getItem('sw-purged')) {
      sessionStorage.setItem('sw-purged', '1')
      location.reload()
    }
  })
}

import { createRoot } from 'react-dom/client'
// Fontes auto-hospedadas (sem request ao Google Fonts, sem FOUT de rede externa)
import '@fontsource/ibm-plex-sans/300.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/bebas-neue/400.css'
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
