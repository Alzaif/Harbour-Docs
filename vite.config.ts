import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3002';
const appBase = '/docs/';

export default defineConfig({
  base: appBase,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist/ui',
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    proxy: {
      [`${appBase}api`]: {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docs/, ''),
      },
      [`${appBase}health`]: {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docs/, ''),
      },
      [`${appBase}version`]: {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docs/, ''),
      },
    },
  },
});
