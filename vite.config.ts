import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1251,
    proxy: {
      '/api': {
        target: 'http://localhost:1251',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:1251',        // Socket.IO on Nest
        ws: true,
      },
    },
  },
})
