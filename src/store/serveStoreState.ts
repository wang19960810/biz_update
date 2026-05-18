import {defineStore, type StoreDefinition} from 'pinia'
import type {Serve} from "../types"

/**
 * 从本地缓存中读取环境配置。
 * 这里必须同步执行，避免页面子组件在父组件 mounted 之前发请求时拿到空值。
 */
const readServeInfoCache = (): Serve | null => {
    if (typeof window === 'undefined') {
        return null
    }

    const cache = localStorage.getItem('serveInfo')
    if (!cache || cache === 'null') {
        return null
    }

    try {
        return JSON.parse(cache) as Serve
    } catch (error) {
        console.error('serveInfo 缓存解析失败:', error)
        return null
    }
}

/**
 * 请求相关信息
 * Represents the state of the serve store.
 * This interface defines the structure for maintaining information related to a serve operation.
 * The serveInfo property holds detailed data about the serve, encapsulating necessary configurations or statuses.
 */
interface ServeStoreState {
    serveInfo: Serve | null // 接口请求的基本信息
}

export const useServeStore: StoreDefinition<'serve', ServeStoreState> = defineStore("serve", {
    state: (): ServeStoreState => {
        return {
            serveInfo: readServeInfoCache(), // 接口请求的基本信息
        }
    },
    actions: {
        /**
         * 手动从缓存同步一次环境配置。
         * 登录后刷新页面或直接访问业务页时，都可以依赖这个兜底。
         */
        hydrateServeInfoFromCache() {
            this.serveInfo = readServeInfoCache()
            return this.serveInfo
        },

        /**
         * 获取环境相关的 URL 和 JWT
         * @param env - 环境类型 ('test' 或 'prod')
         * @param serveInfo - 服务信息
         */
        getServeDetails(env: 'test' | 'prod', serveInfo?: Serve): { url: string; Jwt: string } {
            /**
             * 优先使用显式传入值，其次使用 store 中的值；
             * 如果 store 为空，再尝试从缓存同步一次。
             */
            serveInfo = serveInfo || this.serveInfo || this.hydrateServeInfoFromCache() as Serve

            if (!serveInfo) {
                throw new Error('未找到 serveInfo，请先在登录页保存环境配置。')
            }

            if (env === 'test') {
                return {url: serveInfo.testUrl, Jwt: serveInfo.testJwt};
            }
            return {url: serveInfo.prodUrl, Jwt: serveInfo.prodJwt};
        },

    }
})
