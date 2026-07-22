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
          // math-field: MathLive's web component (simplify-expressions).
          // a-*: A-Frame's custom elements (prepositions3d) - a-scene,
          // a-entity, a-assets, a-camera, etc. are all dynamically created
          // by A-Frame itself, not a fixed list, hence the prefix match.
          isCustomElement: (tag) => tag === 'math-field' || tag.startsWith('a-')
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

            if (id.includes('/three/') || id.includes('\\three\\')) {
              return 'tprboard-three'
            }

            if (id.includes('aframe')) {
              return 'prepositions3d-aframe'
            }
          }
        }
      }
    }
  }
})
