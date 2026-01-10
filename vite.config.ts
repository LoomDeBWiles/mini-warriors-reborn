import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: false,
    host: '0.0.0.0',
    allowedHosts: ['miniwarriors.duckdns.org'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
