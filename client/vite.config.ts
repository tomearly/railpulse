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
        target: 'http://127.0.0.1:5000', // Points directly to your Node backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})