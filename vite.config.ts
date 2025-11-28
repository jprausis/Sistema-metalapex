import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/sistema/', // Define que o app roda dentro da pasta /sistema
  build: {
    outDir: 'dist',
  }
});