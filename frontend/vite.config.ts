import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const source = path.resolve(__dirname, 'src');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': source,
      'next/link': path.resolve(source, 'compat/next-link.tsx'),
      'next/image': path.resolve(source, 'compat/next-image.tsx'),
      'next/navigation': path.resolve(source, 'compat/next-navigation.ts'),
      next: path.resolve(source, 'compat/next.ts'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 3000 },
  };
});
