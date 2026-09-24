import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project site on GitHub Pages: https://leemoose.github.io/openseat/
export default defineConfig({
  plugins: [react()],
  base: '/openseat/',
})
