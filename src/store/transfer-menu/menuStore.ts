import {defineStore, type StoreDefinition} from 'pinia'
import type {MenuItem} from "../../pages/transfer-menu/types"
import type {ServeOptions} from "../../types"
import {filterNewlyAddedData} from "../../pages/transfer-menu/component/reder-menu.ts"
import {useServeStore} from '../serveStoreState.ts'
import {parentFirstSort, safeAwait} from "../../units/tool.ts"
import {useTransferMenuGlobalStore} from "./transferMenuGlobalStore.ts"
import axios from "axios";


/**
 * 菜单
 * Represents the state of the menu store containing lists of menu items.
 * This interface defines the structure for maintaining different sets of menu items,
 * such as test and production environments. It provides a way to organize and manage
 * menu configurations separately based on their intended usage context.
 */
interface MenuStoreState {
    // 测试环境 菜单数据
    menuListDataTest: MenuItem[]
    // 测试环境数据(扁平化的)
    menuListFlatDataTest: MenuItem[]
    // 正式环境 菜单数据
    menuListPro: MenuItem[]
    // 正式环境数据(扁平化的)
    menuListFlatDataPro: MenuItem[]
    // 可新增的正式环境 的菜单
    addedDataMenuList: MenuItem[]
    // 选择的菜单 - 测试环境
    selectedMenu: MenuItem[]
    // 选择的菜单 - 正式环境
    selectedMenuTest: MenuItem[]
}

export const useMenuStore: StoreDefinition<'menu', MenuStoreState> = defineStore('menu', {
    state: (): MenuStoreState => {
        return {
            menuListDataTest: [],
            menuListFlatDataTest: [],
            menuListPro: [],
            menuListFlatDataPro: [],
            addedDataMenuList: [],
            selectedMenu: [],
            selectedMenuTest: [],
        }
    },
    actions: {
        /**
         * 更新数据获取
         */
        async getUpdatedMenuList() {
            const [testMenu, proMenu] = await Promise.all([
                this.fetchMenu('test'),
                this.fetchMenu('prod'),
            ]);
            this.menuListDataTest = testMenu;
            this.menuListPro = proMenu;
            const {
                addedDataMenuList,
                testMenuListFlat,
                proMenuListFlat
            } = filterNewlyAddedData(this.menuListDataTest, this.menuListPro);
            this.addedDataMenuList = addedDataMenuList
            this.menuListFlatDataTest = testMenuListFlat
            this.menuListFlatDataPro = proMenuListFlat
        },


        /**
         * 通用菜单获取方法
         * @param env - 环境类型 ('test' 或 'prod')
         */
        async fetchMenu(env: 'test' | 'prod'): Promise<MenuItem[]> {
            const {url, Jwt} = useServeStore().getServeDetails(env);
            const response = await axios.get(`${url}/crm-mdm/v1/competences/competences/findByViewItemAndCurrentUser?viewItem=true&codeOrComment=`, {
                headers: {Jwt},
            });

            return response.data.data;
        },

        /**
         * 更新菜单环境 - 同步 (菜单位置、名称等基本信息)
         * 主要用于 单独修改了测试或正式环境的基本信息
         * @env 需要被同步的 环境
         */
        async syncMenuEnvironment(env: 'test' | 'prod' = 'test') {
            const envMenuList1 = env === 'test' ? this.selectedMenuTest : this.selectedMenu
            const envMenuList2 = env === 'test' ? this.menuListFlatDataPro : this.menuListFlatDataTest
            console.log(envMenuList1)

            sessionStorage.setItem('envMenuList', JSON.stringify(envMenuList1))
            let filteredData: MenuItem[] = []
            envMenuList1.forEach((menu: MenuItem) => {
                const code = menu.code;
                const findMenu = envMenuList2.find(item => item.code === code);
                if (findMenu) {
                    findMenu.id = menu.id
                    findMenu.roleCodes = menu.roleCodes
                    delete findMenu.children
                    filteredData.push(findMenu)
                }
            })
            console.log(filteredData)
            await this.sequentialRequestsWithRetry(filteredData, env)
        },

        /**
         * 循环 更新请求
         * @param menuData
         * @param env
         * @param options
         */
        async sequentialRequestsWithRetry(menuData: MenuItem[], env: 'test' | 'prod', options: ServeOptions = {}) {
            const {
                delay = 1000,
                maxRetries = 1,
                retryDelay = 2000
            } = options

            const results = []
            useTransferMenuGlobalStore().loading = true
            console.log(menuData);

            for (let [index, menu] of menuData.entries()) {
                let retryCount = 0;
                let success = false;

                while (retryCount < maxRetries && !success) {
                    try {
                        console.log(`请求 ${menu.comment} (尝试 ${retryCount + 1}/${maxRetries + 1})`);
                        const res = await this.sendUpdateRequest(menu, env)
                        if (!res.data.success) throw new Error(`HTTP ${res}`);
                        results.push(res.data.data)
                        success = true
                    } catch (err) {
                        retryCount++
                        if (retryCount >= maxRetries) {
                            console.error(`请求失败，已达最大重试次数:`, err);
                            results.push({error: err});
                        } else {
                            console.log(`请求失败，${retryDelay}ms 后重试...`);
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                        }
                    }
                    // 请求间隔
                    if (index < menuData.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            useTransferMenuGlobalStore().loading = false
        },

        /**
         * 添加菜单到正式环境
         */
        async addMenuToPro() {
            const selectMenuSort = parentFirstSort(this.selectedMenu)
            selectMenuSort.map(item => {
                return this.sendUpdateRequest(item, 'test')
            })
        },

        /**
         * 菜单
         * @param params
         * @param env
         */
        async sendUpdateRequest(params: MenuItem, env: 'test' | 'prod') {
            const {Jwt, url} = useServeStore().getServeDetails(env);
            const methods = params.id ? 'patch' : 'post';
            const headers = {Jwt}
            console.log(`${methods === 'post' ? '新增' : '更新'}菜单 ===> ${params.comment} ====> 开始`)
            const res = await safeAwait(axios[methods](`${url}/crm-mdm/v1/competences/competences`, params, {headers}), `${methods === 'post' ? '新增' : '更新'}菜单 ===> ${params.comment} ====> 失败`)
            console.log(`${methods === 'post' ? '新增' : '更新'}菜单 ===> ${params.comment} ====> 结束`)
            return res
        }

    }
})