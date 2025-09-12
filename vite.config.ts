import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg?react', // Ensure SVGs with ?react are processed
      svgrOptions: {
        svgo: true, // Optimize SVGs
        svgoConfig: {
          plugins: [{ removeViewBox: false }],
        },
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 1252,
    proxy: {
      '/api': {
        target: 'http://localhost:1251',
        changeOrigin: true,
        ws: true
      },
      '/socket.io': {
        target: 'http://localhost:1251',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
