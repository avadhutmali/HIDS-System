import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // sockjs-client is a Node.js library that references `global`.
  // This polyfills it so it works in the browser environment.
  define: {
    global: 'globalThis',
  },
  server: {
    host: true,          // bind to 0.0.0.0 so phone can connect
    port: 5173,
    proxy: {
      '/api': 'https://13.203.207.207/:8081',
      '/ws': { target: 'https://13.203.207.207/:8081', ws: true },
    }
  }
})
