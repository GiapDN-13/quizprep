import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = '/quizprep/' khi deploy lên GitHub Pages, '/' khi chạy dev/Netlify
export default defineConfig(({ mode }) => ({
  base: mode === 'ghpages' ? '/quizprep/' : '/',
  plugins: [react()],
}))
