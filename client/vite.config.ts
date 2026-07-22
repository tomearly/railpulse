import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Add this block below your plugins
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // Updated port
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000', // Updated port
        ws: true,
        changeOrigin: true,
      }
    }
  }
})