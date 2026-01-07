import { createPinia } from "pinia";
import { useServeStore } from './serveStoreState.ts'
const pinia = createPinia()

export {
    useServeStore
}

export * from './transfer-menu'

export default pinia