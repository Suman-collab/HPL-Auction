import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://hpl-auction.onrender.com/',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://hpl-auction.onrender.com/',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://hpl-auction.onrender.com/',
        ws: true,
      },
    },
  },
});
