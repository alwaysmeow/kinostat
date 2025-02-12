import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/kinopoisk-api': {
        target: 'https://www.kinopoisk.ru/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/kinopoisk-api/, ''),
      },
    },
  }
})
