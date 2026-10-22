import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // math-field: MathLive's web component (simplify-expressions).
          isCustomElement: (tag) => tag === 'math-field'
        }
      }
    }),
    tailwindcss(),
    VitePWA({
      // Custom src/sw.ts: per-app runtime caches instead of precaching
      // everything (public/data is hundreds of MB).
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['index.html', 'favicon.ico', 'icons/apple-touch-icon.png']
      },
      manifest: {
        name: 'Sam Learns Things',
        short_name: 'samlearns',
        description: 'A meta-app for learning apps and interfaces.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
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
          }
        }
      }
    }
  }
})
