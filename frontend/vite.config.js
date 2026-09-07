import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

const shouldAnalyze = process.env.ANALYZE === 'true'

export default defineConfig({
  plugins: [
    react(),
    shouldAnalyze && visualizer({ filename: 'dist/bundle-analysis.html', open: true })
  ].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-recharts'
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
            return 'vendor'
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
