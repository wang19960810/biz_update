import {defineStore, type StoreDefinition} from 'pinia'
import type {Serve} from "../types"

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
            serveInfo: null, // 接口请求的基本信息
        }
    },
    actions: {
        /**
         * 获取环境相关的 URL 和 JWT
         * @param env - 环境类型 ('test' 或 'prod')
         * @param serveInfo - 服务信息
         */
        getServeDetails(env: 'test' | 'prod', serveInfo?: Serve): { url: string; Jwt: string } {
            serveInfo = serveInfo || this.serveInfo as Serve

            if (env === 'test') {
                return {url: serveInfo.testUrl, Jwt: serveInfo.testJwt};
            }
            return {url: serveInfo.prodUrl, Jwt: serveInfo.prodJwt};
        },

    }
})