import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createApi } from './server/api.mjs'
import { createStore } from './server/store.mjs'
import { openDatabase } from './server/db.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server settings from .env / .env.local (written by `vercel env pull`). Never exposed to the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'APP_TIME_ZONE']) if (env[key] && !process.env[key]) process.env[key] = env[key]
  return {
    plugins: [react(), { name: 'shop-api', configureServer(server) {
      // Uses DATABASE_URL when set, otherwise a local embedded Postgres in .data/pglite.
      const api = openDatabase().then(createStore).then(store => createApi(store))
      server.middlewares.use(async (req, res, next) => (await api)(req, res, next))
    } }],
    server: { host: '127.0.0.1' },
  }
})
