import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // Client-side routing means a deep link such as /analytics is a request for a
  // path that has no file on disk. Rewriting those to index.html lets the dev
  // server hand the URL to the router, which then renders the right page.
  // Without this, reloading or sharing /live returns a 404.
  server: {
    appType: 'spa',
  },
  preview: {
    appType: 'spa',
  },
})
