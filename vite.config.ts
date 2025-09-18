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

          // Add resource proxy endpoint to handle proper 404 status codes
          server.middlewares.use('/api/v1/resources', async (req: IncomingMessage, res: ServerResponse, next) => {
            if (req.method === 'GET') {
              try {
                const resourceId = req.url?.split('/').pop();
                if (!resourceId) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Resource ID required' }));
                  return;
                }

                // Use the local development API endpoint
                const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
                const apiUrl = `${apiBaseUrl}/resources/${resourceId}?format=json`;
                
                console.log('Proxying request to:', apiUrl);
                
                const response = await fetch(apiUrl, {
                  headers: {
                    'Accept': 'application/vnd.api+json, application/json',
                    'Content-Type': 'application/json',
                  },
                });

                console.log('API response status:', response.status);
                console.log('API response content-type:', response.headers.get('content-type'));

                res.statusCode = response.status;
                res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
                
                const responseText = await response.text();
                console.log('API response body (first 200 chars):', responseText.substring(0, 200));
                res.end(responseText);
              } catch (error) {
                console.error('Resource proxy error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
              }
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
