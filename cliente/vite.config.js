import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({//allow domain https://projectors-subject-valve-royal.trycloudflare.com
  server: {
    allowedHosts: ['projectors-subject-valve-royal.trycloudflare.com'],
  },
  plugins: [react()],
})
