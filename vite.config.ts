import { defineConfig } from 'vite'
import vueSetupExtend from "vite-plugin-vue-setup-extend"
import vue from '@vitejs/plugin-vue'
import {fileURLToPath, URL} from "url";


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
    port: 3000,
    hmr: true,
    allowedHosts: ["rd4f58e7.natappfree.cc"],
    proxy: {
      '/dbRoot.v5': {
        target: 'http://www.example.com',
        changeOrigin: true,
      },
      '/biz': {
        target: 'http://hr.biz-united.com.cn:8210',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }

})
