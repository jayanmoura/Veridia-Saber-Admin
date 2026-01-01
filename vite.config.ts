import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,      // Porta para quando você roda 'npm run dev'
    host: true
  },
  preview: {
    port: 3000,      // <--- IMPORTANTE: Porta para produção (preview)
    host: true,
    allowedHosts: true // Libera acesso externo se necessário
  }
})