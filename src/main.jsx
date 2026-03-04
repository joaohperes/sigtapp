import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TooltipProvider delayDuration={300}>
      <App />
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  </StrictMode>,
)
