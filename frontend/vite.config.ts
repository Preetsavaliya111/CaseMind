import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const src = (directory: string) => path.resolve(import.meta.dirname, directory)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': src('./src'),
      '@components': src('./src/components'),
      '@features': src('./src/features'),
      '@hooks': src('./src/hooks'),
      '@services': src('./src/services'),
      '@types': src('./src/types'),
      '@utils': src('./src/utils'),
      '@styles': src('./src/styles'),
      '@assets': src('./src/assets'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts')) return 'charts'
          if (id.includes('@tanstack/react-query')) return 'query'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor'
          return undefined
        },
      },
    },
  },
})
