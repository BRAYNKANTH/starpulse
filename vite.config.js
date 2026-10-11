import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createApi } from './server/api.mjs'
import { createStore } from './server/store.mjs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), { name: 'shop-api', configureServer(server) {
    const store = createStore(resolve(process.env.DATA_DIR || '.data'));
    process.once('exit', () => store.close());
    server.middlewares.use(createApi(store));
  } }],
  server: { host: '127.0.0.1' },
})
