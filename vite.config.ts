import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Serve markdown content from the artifacts directory at /course-md/*.md
  publicDir: path.resolve(__dirname, 'company/projects/course-1-preflop/artifacts'),
})
