import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The site opens at http://skillgraph (add "127.0.0.1 skillgraph" to the hosts file)
    host: true,
    port: 80,
    strictPort: true, // Fail loudly if port 80 is busy instead of silently using another one
    allowedHosts: ['skillgraph'],

    // The browser calls /api on the same address as the site and Vite forwards it to the backend.
    // Same address for page and API means the login cookie works without any CORS tricks.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})