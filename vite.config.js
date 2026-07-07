import { defineConfig } from 'vite';
import { pulsarPages } from './scripts/pages-plugin.js';

export default defineConfig({
  plugins: [pulsarPages()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three/ },
            { name: 'gsap', test: /node_modules[\\/](gsap|lenis)/ },
          ],
        },
      },
    },
  },
});
