import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    base: './', 
    server: {
      host: true, 
      port: 5173,
      allowedHosts: true, 
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy: any, _options) => {
            // Fix: casting proxy to any to allow .on listener
            proxy.on('error', (err: any, _req: any, _res: any) => {
              console.error('[Vite Proxy Connection Error]', err);
            });
          },
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.browser': true,
    }
  }
})