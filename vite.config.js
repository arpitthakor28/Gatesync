import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Gatesync/',
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'GateSync - Residential Security & Visitor Management',
        short_name: 'GateSync',
        description: 'Real-time visitor gate approvals, security registry, billing and society management',
        theme_color: '#0284c7',
        background_color: '#f0f9ff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/Gatesync/',
        scope: '/Gatesync/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/SocietySync/**', '**/legacy_php_system/**', '**/scratch/**']
    }
  }
});
