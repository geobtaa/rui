import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: env.VITE_BASE_URL || '/',
    plugins: [
      react(),
      {
        name: 'wms-middleware',
        async configureServer(server) {
          const express = (await import('express')).default;
          const { handleWmsRequest } = await import('./server/middleware/wms');

          server.middlewares.use(express.json());
          
          // Add WMS endpoint
          server.middlewares.use('/wms/handle', (req: IncomingMessage, res: ServerResponse, next) => {
            if (req.method === 'POST') {
              handleWmsRequest(req, res);
            } else {
              next();
            }
          });
        },
      },
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
