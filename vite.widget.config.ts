import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'public/widget',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/widget/main.tsx'),
      output: {
        entryFileNames: 'storefinder.js',
        assetFileNames: 'storefinder.[ext]',
        // Single bundle, no code splitting
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
