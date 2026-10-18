import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Split the heavy third-party libs out of the main bundle so the browser
// can fetch them in parallel and cache them across deploys.
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.endsWith('/src/auth-runtime.js')) return 'auth-runtime';
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
            return 'vendor-react';
          }
          if (id.includes('/@firebase/')) return 'vendor-firebase';
          if (id.includes('/lucide-react/')) return 'vendor-icons';
          if (id.includes('/@google/genai/')) return 'vendor-genai';
          return undefined;
        },
      },
    },
  },
});
