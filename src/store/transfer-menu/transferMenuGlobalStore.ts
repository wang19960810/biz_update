import {defineStore, type StoreDefinition} from 'pinia'

/**
 * 菜单同步的全局状态
 * This interface is used to track the current state of the transfer menu,
 * including the active step, the list of steps with their respective details,
 * and the loading status of the transfer operation.
 */
interface TransferMenuGlobalStoreState {
    activeIndex: number, // 当前步骤
    stepsArray: Array<{ title: string, describe: string }>, // 步骤条 菜单
    loading: boolean,  // 加载动画
}

export const useTransferMenuGlobalStore: StoreDefinition<"transferMenuGlobal", TransferMenuGlobalStoreState> = defineStore('transferMenuGlobal', {
    state: (): TransferMenuGlobalStoreState => {
        return {
            stepsArray: [
                {
                    title: '基础信息',
                    describe: '请求所需基础信息完善'
                }, {
                    title: '菜单同步',
                    describe: '菜单同步'
                },
                {
                    title: '数据视图同步',
                    describe: '数据视图同步'
                },
                // {
                //     title: '页面配置同步',
                //     describe: '页面配置同步'
                // },
                {
                    title: '数据字典同步',
                    describe: '数据字典同步'
                },
            ], // 步骤条 菜单
            activeIndex: 0, // 当前步骤
            loading: false, // 加载状态
        }
    }
})
