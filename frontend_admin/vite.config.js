import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/admin-console/',
  plugins: [react()],
  // Publish files at their public URL paths; Services preserves the request path.
  build: {
    outDir: 'dist/admin-console',
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
})
