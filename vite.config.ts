/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// Static-first build: the whole app is client-side so it can be hosted on any free static host.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    // Installable on a phone and usable offline: the whole app, the code workers and SQLite are precached.
    VitePWA({
      registerType: 'autoUpdate',
      // An external register file: the page CSP allows no inline scripts.
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,wasm}'], maximumFileSizeToCacheInBytes: 3_000_000 },
      manifest: {
        name: 'SDET Quest',
        short_name: 'SDET Quest',
        description: 'Scroll to learn: SDET 3 and QA Lead interview prep.',
        // Relative, so it works at the site root and under /sdet-quest/ on GitHub Pages.
        start_url: 'feed',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0e15',
        theme_color: '#0a0e15',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Workers get their own folder so public/_headers can give them a stricter, separate CSP.
  worker: {
    format: 'es',
    rollupOptions: { output: { entryFileNames: 'sandbox/[name]-[hash].js', chunkFileNames: 'sandbox/[name]-[hash].js' } },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          editor: ['@uiw/react-codemirror', '@codemirror/lang-javascript', '@codemirror/lang-sql', '@codemirror/lang-java'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
});
