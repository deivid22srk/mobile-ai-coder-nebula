import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server proxies all /api/* calls to the existing Node backend on port 3000.
// This way the React UI talks to the same Express server (chats, SSE, skills, files, etc.)
// without CORS tweaks during development.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // SSE endpoints (POST /api/chat) need ws:false + no buffering; default proxy already
        // streams chunked responses, but we keep these flags explicit for clarity.
        secure: false,
        ws: false
      }
    }
  }
})
