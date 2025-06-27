import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});

/*// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),             // Enables React Fast Refresh, JSX, etc.
  ],
  server: {
    // When your React app does `fetch('/api/…')`, Vite will forward
    // that request to your Spring Boot server on port 8080.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,  // updates the Host header to match the target
        secure: false,       // if you're using self-signed certs on the backend
        // Optional: you can rewrite the path if your backend has a different context path
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
}); */