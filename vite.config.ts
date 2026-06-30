import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The only chunks over 500KB are intentional and off the first-paint path:
    // `firebase` (vendor, isolated + long-cached below) and `html2pdf` (lazy —
    // loaded only when a coach exports a PDF). The app entry chunk is ~216KB.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Pull firebase (the dominant dependency) into its own long-cacheable
        // vendor chunk so it isn't re-downloaded on every app deploy and stays
        // out of the per-route chunks.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase'
          }
        },
      },
    },
  },
})
