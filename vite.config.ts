import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
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
    host: process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0',
    port: 1252,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' ? 'http://localhost:7219' : 'http://localhost:1251',
        changeOrigin: true,
        ws: true
      },
      '/socket.io': {
        target: process.env.NODE_ENV === 'production' ? 'http://localhost:7219' : 'http://localhost:1251',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
