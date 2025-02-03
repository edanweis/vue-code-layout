import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('vue-monaco-editor')
        }
      }
    }),
    vueJsx()
  ],
  resolve: {
    alias: {
      'vue-code-layout': resolve(__dirname, '../library'),
      '@': resolve(__dirname, '.')
    }
  }
})
