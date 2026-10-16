import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    target: 'es2015',
    commonjsOptions: { include: [/node_modules/, /plate-core\.cjs$/] }
  }
})
