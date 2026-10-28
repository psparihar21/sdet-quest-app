/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Static-first build: the whole app is client-side so it can be hosted on any free static host.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
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
