import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';
import checker from 'vite-plugin-checker';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    preact(),
    checker({
      typescript: true
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'assets/backgrounds/*.svg',
        'assets/fx/*.png',
        'assets/icons/*.svg',
        'assets/icons/tools/*.svg',
        'assets/audio/*.{wav,mp3,webm}',
        'assets/lottie/*.json'
      ],
      manifest: {
        name: 'Herói do Futuro - Kiosk',
        short_name: 'HeroiKiosk',
        description: 'Jogo pedagógico premium para experiências sensoriais e tecnológicas.',
        theme_color: '#071426',
        background_color: '#071426',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          {
            src: '/assets/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/assets/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,wav,mp3,webm,json}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'heroi-kiosk-audio-v1',
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          }
        ],
        navigateFallbackDenylist: [/^\/spectator\.html/]
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        spectator: resolve(__dirname, 'spectator.html')
      }
    }
  }
});
