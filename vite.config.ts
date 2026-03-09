import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site base path
  base: '/course-1-preflop-site/',
  // Serve markdown content from the canonical workspace artifacts dir at /course-md/*.md
  // so production builds cannot drift from Company OS source-of-truth markdown.
  publicDir: path.resolve(__dirname, '../../company/projects/course-1-preflop/artifacts'),
})
