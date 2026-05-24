import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content/scraper-runner': resolve(__dirname, 'src/content/scraper-runner.ts')
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sidepanel' ? 'assets/[name].js' : '[name].js'),
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});
