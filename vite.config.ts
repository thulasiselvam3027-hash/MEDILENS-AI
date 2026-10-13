import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handleApiRequest } from './server/api.ts'

function apiPlugin(): Plugin {
  return {
    name: 'medilens-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          try {
            const handled = await handleApiRequest(req, res)
            if (handled) return
          } catch (err) {
            console.error('API middleware error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Internal server error in API middleware' }))
            return
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
})
