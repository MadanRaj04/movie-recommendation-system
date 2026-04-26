import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import moviesPlugin from './vite-plugin-movies.js'

export default defineConfig({
  plugins: [
    react(),
    moviesPlugin({
      jsonlPath: path.resolve(__dirname, '../backend/data/raw/movies_clean.jsonl'),
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React runtime in its own chunk
          'vendor-react': ['react', 'react-dom'],
          // Zustand state in its own chunk
          'vendor-zustand': ['zustand'],
        },
      },
    },
  },
})
