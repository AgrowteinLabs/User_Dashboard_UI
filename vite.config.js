import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/': {
        target: 'https://api.agrowtein.com',
        changeOrigin: true,
        secure: false,  // Set to false if using HTTP
        cookieDomainRewrite: 'localhost',
      }
    }
  }
});
