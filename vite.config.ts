import { defineConfig } from 'vite'
import vueSetupExtend from "vite-plugin-vue-setup-extend"
import vue from '@vitejs/plugin-vue'
import {fileURLToPath, URL} from "url";
import http from 'http';
import https from 'https';

// 创建 keep-alive agent 复用连接，避免并发请求随机失败
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 })
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100, rejectUnauthorized: false })

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueSetupExtend()],
  resolve: {
    alias: {
      '@src': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
    }
  },
  server: {
    host: "0.0.0.0",
    open: true,
    port: 3001,
    strictPort: true,
    hmr: true,
    headers: {
      "Cache-Control": "no-store"
    },
    allowedHosts: ["rd4f58e7.natappfree.cc"],
    proxy: {
      '/dbRoot.v5': {
        target: 'http://www.example.com',
        changeOrigin: true,
      },
      '^/biz(?:/|$)': {
        target: 'http://hr.biz-united.com.cn:8210',
        changeOrigin: true,
      },
      '/api-test': {
        target: 'http://bz1.sxg2017.com:8200',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-test/, ''),
        agent: httpAgent,
      },
      '/api-prod': {
        target: 'https://crm-prod.sxg2017.com:18088',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-prod/, ''),
        agent: httpsAgent,
      },
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    }
  }

})