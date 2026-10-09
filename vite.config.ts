import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              priority: 30,
            },
            {
              name: 'motion-vendor',
              test: /node_modules[\\/](motion|framer-motion|@motionone)[\\/]/,
              priority: 25,
            },
            {
              name: 'icons-vendor',
              test: /node_modules[\\/]@phosphor-icons[\\/]/,
              priority: 25,
            },
            {
              name: 'gsap-vendor',
              test: /node_modules[\\/]gsap[\\/]/,
              priority: 25,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              maxSize: 250_000,
              priority: 1,
            },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
