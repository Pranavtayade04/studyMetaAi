import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standard Vite + React setup. Kept intentionally minimal.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
