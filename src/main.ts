import { createApp } from 'vue'
import Router from "./router/index";

import ElementPlus from "element-plus"
import pinia from "./store"
import { instance } from "./server"
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'

import './style.scss'

globalThis.http = instance
createApp(App).use(ElementPlus,{locale: zhCn}).use(Router).use(pinia).mount('#app')
