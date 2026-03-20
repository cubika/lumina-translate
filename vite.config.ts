import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

// Dynamic proxy for custom OpenAI-compatible endpoints (Azure, Ollama, etc.)
function customProxyPlugin(): Plugin {
  return {
    name: 'custom-openai-proxy',
    configureServer(server) {
      server.middlewares.use('/proxy/custom', async (req, res) => {
        const targetBase = req.headers['x-proxy-target'] as string
        if (!targetBase) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing x-proxy-target header' }))
          return
        }
        const subPath = req.url || ''
        const targetUrl = targetBase + subPath

        // Collect request body
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks)
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'] as string
            if (req.headers['api-key']) headers['api-key'] = req.headers['api-key'] as string

            const resp = await fetch(targetUrl, {
              method: req.method || 'POST',
              headers,
              body: body.length > 0 ? body : undefined,
            })
            res.writeHead(resp.status, { 'Content-Type': resp.headers.get('content-type') || 'application/json' })
            const respBody = await resp.arrayBuffer()
            res.end(Buffer.from(respBody))
          } catch (err: any) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: { message: err.message || 'Proxy error' } }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    customProxyPlugin(),
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'electron-store'],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/proxy/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/anthropic/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
      '/proxy/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/openai/, ''),
      },
    },
  },
})
