import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://insurance-backend-fk1k.onrender.com',
        changeOrigin: true,
      }
    }
  }
})
