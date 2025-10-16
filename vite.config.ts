import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Use base path only for production (GitHub Pages)
  // In dev mode, use root path '/'
  base: mode === 'production' ? '/SoTayChoHDV/' : '/',
}))
