import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // lvh.me trỏ về 127.0.0.1; TikTok LIVE Studio không nhận "localhost"
    allowedHosts: ['lvh.me', '.lvh.me', 'localhost', '127.0.0.1'],
    watch: {
      ignored: ['**/settings.json', '**/release/**', '**/dist/**', '**/runtime/**', '**/*.exe', '**/*.bat'],
    },
  },
});
