import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// PWA/service worker removido: a ferramenta é online (depende do Supabase) e o
// SW só causava servir bundle JS desatualizado após deploys. O main.jsx
// desregistra qualquer SW remanescente nos navegadores que já tinham um.
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
