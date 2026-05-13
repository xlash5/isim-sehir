import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-index-to-404',
      closeBundle() {
        const dist = resolve(__dirname, 'dist')
        if (existsSync(dist)) {
          copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
        }
      },
    },
  ],
  appType: 'spa',
  server: {
    port: 5173,
  },
})
