import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'math-field'
        }
      }
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@cortex-js/compute-engine')) {
              return 'simplify-engine'
            }

            if (id.includes('mathlive') || id.includes('katex')) {
              return 'simplify-math-ui'
            }

            if (id.includes('dexie') || id.includes('lucide-vue-next')) {
              return 'simplify-app'
            }

            if (id.includes('mermaid')) {
              return 'erd-mermaid'
            }
          }
        }
      }
    }
  }
})
