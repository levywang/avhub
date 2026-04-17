import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['imgs/favicon.ico', 'imgs/logo.png', 'imgs/logo_opaque.png'],
      manifest: {
        name: 'AvHub',
        short_name: 'AvHub',
        description: 'R18 Resource Search & Manager',
        start_url: '/',
        display: 'standalone',
        background_color: '#141518',
        theme_color: '#1bb76e',
        icons: [
          {
            src: 'imgs/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'imgs/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'imgs/avhub_screenshot_cn_01.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'AvHub 搜索页面'
          },
          {
            src: 'imgs/avhub_screenshot_cn_01.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'AvHub 搜索页面'
          }
        ]
      },
      workbox: {
        // 缓存静态资源
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // API 请求走网络优先
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }
            }
          },
          {
            urlPattern: /^https:\/\/fourhoi\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cover-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
