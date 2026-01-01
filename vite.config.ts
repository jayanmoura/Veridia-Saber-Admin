import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // <--- 1. Importe isso aqui

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 2. Adicione este bloco inteiro do PWA 👇
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      devOptions: {
        enabled: true // Habilita o SW em modo de desenvolvimento
      },
      manifest: {
        name: 'Veridia Admin',
        short_name: 'Veridia',
        description: 'Painel Administrativo do Veridia Saber',
        theme_color: '#064e3b', // Verde escuro do seu tema
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // OBRIGATÓRIO: Crie essa imagem na pasta public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // OBRIGATÓRIO: Crie essa imagem na pasta public
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: true
  }
})