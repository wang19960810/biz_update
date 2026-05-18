import { createApp } from 'vue'
import Router from "./router/index";

import ElementPlus from "element-plus"
import pinia from "./store"
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'

import './style.scss'

const cleanupDevRuntimeCache = async () => {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.allSettled(registrations.map((registration) => registration.unregister()))
  }

  if ("caches" in window) {
    const cacheKeys = await window.caches.keys()
    await Promise.allSettled(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)))
  }
}

await cleanupDevRuntimeCache()

createApp(App).use(ElementPlus,{locale: zhCn}).use(Router).use(pinia).mount('#app')
