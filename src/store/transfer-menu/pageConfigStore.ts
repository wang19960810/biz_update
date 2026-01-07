import {defineStore} from 'pinia'
import type {MenuItem, PageConfig, PageConfigDetail} from "../../pages/transfer-menu/types"
import {useDataViewStore, useDictCodeStore, useMenuStore} from './index.ts'
import {useServeStore} from '../serveStoreState.ts'
import axios from "axios";
import qs from "qs"
import {safeAwait} from "../../units/tool.ts"

/**
 * 页面配置
 * Represents the state of the PageConfigStore, which manages a collection of page configurations.
 * This interface is designed to provide a standardized structure for storing and accessing
 * configuration data related to pages within an application.
 * The state primarily consists of a list of page configurations, enabling centralized management
 * and retrieval of page-specific settings or metadata.
 */

interface PageConfigStoreState {
    updatablePageConfigs: PageConfig[]
    addedPageConfigs: PageConfig[]
    pageOptionTest: PageConfig[]
    pageOptionPro: PageConfig[]
    selectedPage: MenuItem[]
}

interface PromiseAllSettled {
    status: string, // 请求状态
    value: any // 返回数据
}

interface GetDataOptions {
    dataView?: boolean,
    pageConfig?: boolean,
    dictCode?: boolean
}

export const usePageConfigStore = defineStore('config', {
    state: (): PageConfigStoreState => {
        return {
            updatablePageConfigs: [], // 当前选择的菜单 需要更新的 页面配置列表
            addedPageConfigs: [], // 测试环境 新增的页面配置
            selectedPage: [], //  选择的页面配置
            pageOptionTest: [], // 测试环境页面配置
            pageOptionPro: [], // 正式环境页面配置
        }
    },
    actions: {

        /**
         * 循环获取页面配置及数据视图
         * @param menus 菜单项列表
         * @param options 可配置项 更新那些数据
         */
        async getPageConfigByMenu(menus: MenuItem[] = useMenuStore().selectedMenu, options?: GetDataOptions) {
            const dataViewStore = useDataViewStore()

            dataViewStore.dataViewsUpdatable = []
            this.updatablePageConfigs = []

            // 循环 根据菜单 获取页面配置
            const requestAllFulfilled = menus.map(async (item: MenuItem) => {
                const optionRequests = await this.getMenuPageOption(item) as PromiseAllSettled[];

                const [pageOptionTest] = optionRequests.map(req => req.value.data.result.records);

                pageOptionTest.forEach((itemConfig: PageConfig) => itemConfig.parentName = item.comment)

                this.updatablePageConfigs = [...this.updatablePageConfigs, ...pageOptionTest]


                // 获取页面配置 后处理数据
                const newConfigListDataView = await this.processOptionRequests(item, optionRequests) || [];
                if (options?.pageConfig) {

                }

                // 根据 正式环境还未配置的列表 去查询那些数据视图需要增加
                if (options && options.dataView) {

                    const requestArr = newConfigListDataView.map(async (i: PageConfig) => dataViewStore.getDataView(i, 'prod', item))

                    const viewDataRequest = await Promise.allSettled([...requestArr])

                    return useDataViewStore().AfterGetDataViewPro(viewDataRequest as PromiseAllSettled[]);
                }
            });
            const results = await Promise.allSettled(requestAllFulfilled);
            console.log('检测更新结束', results);
        },


        /**
         * 获取页面配置 后处理数据
         * @param item
         * @param optionRequests
         */
        async processOptionRequests(item: MenuItem, optionRequests: PromiseAllSettled[]) {
            const logSuccess = (comment: string, env: string) =>
                console.log(`获取成功 "${comment}" 页面配置(${env}环境)`);

            const logFailure = (comment: string, env: string) =>
                console.log(`获取失败 "${comment}" 页面配置(${env}环境)`);

            if (optionRequests.every(req => req.status === 'fulfilled')) {
                logSuccess(item.comment, '测试');
                logSuccess(item.comment, '正式');
                const [pageOptionTest, pageOptionPro] = optionRequests.map(req => req.value.data.result.records);

                return this.getPageConfigAfter(pageOptionTest, pageOptionPro, item.comment)
            } else {
                optionRequests.forEach(req => {
                    req.status === 'fulfilled'
                        ? logSuccess(item.comment, '正式')
                        : logFailure(item.comment, '正式');
                });
                return null;
            }
        },

        /**
         * 获取 菜单的 页面配置
         * @param data - 菜单项数据
         */
        async getMenuPageOption(data: MenuItem) {
            const DEFAULT_PAGE_SIZE = 100;

            // 构建请求参数
            const buildRequestParams = (parentCode: string) => ({
                parentCode,
                pageNum: 1,
                pageSize: DEFAULT_PAGE_SIZE,
                page: 1,
                size: DEFAULT_PAGE_SIZE,
            });

            // 发送请求
            const sendRequest = async (url: string, headers: Record<string, string>) => {
                return axios.get(url, {headers})
            };

            const params = buildRequestParams(data.code);
            const queryString = qs.stringify(params);

            // 获取测试环境和正式环境的 URL 和 JWT
            const {url: testUrl, Jwt: testJwt} = useServeStore().getServeDetails('test');
            const {url: prodUrl, Jwt: prodJwt} = useServeStore().getServeDetails('prod');

            // 构造完整请求 URL
            const requestUrl = `${testUrl}/crm-mdm/v1/table/functionsub/findByCondition?${queryString}`;
            const requestUrl1 = `${prodUrl}/crm-mdm/v1/table/functionsub/findByCondition?${queryString}`;

            // 构造请求头
            const headers = {Jwt: testJwt};
            const headers1 = {Jwt: prodJwt};

            console.log(`开始获取  "${data.comment}"  页面配置(测试环境)`)
            const request = sendRequest(requestUrl, headers);
            console.log(`开始获取  "${data.comment}"  页面配置(正式环境)`)
            const request1 = sendRequest(requestUrl1, headers1);

            return Promise.allSettled([request, request1]);
        },

        /**
         * 获取菜单的页面配置后的数据处理
         * @param result // 测试环境  页面配置
         * @param result1 // 正式环境 页面配置
         * @param parentName // 菜单名称
         */
        getPageConfigAfter(result: PageConfig[], result1: PageConfig[], parentName: string) {


            // 当前查询页 正式环境下 所有页面配置的 功能编码
            const proPageConfigFunctionCodes = result1.map((i: PageConfig) => i.functionCode)

            // 测试环境 过滤并保存 当前查询页 在正式环境下 还未配置的 所有功能配置(所有列表 和 表单)
            const newConfigList = result.filter((item: PageConfig) => !proPageConfigFunctionCodes.includes(item.functionCode))
            newConfigList.forEach((i: PageConfig) => {
                i.parentName = parentName
                delete i.id
            });
            this.addedPageConfigs = [...newConfigList, ...this.addedPageConfigs]

            // 所有的走数据视图的列表
            const pageConfigListByDataView: PageConfig[] = []
            result.forEach((r: PageConfig) => {
                if (r.functionType === '1' && r.configSource) { // 列表 且走 数据视图
                    delete r.id // 删除测试环境ID
                    const isOld = proPageConfigFunctionCodes.includes(r.functionCode)  // 是否正式环境已存在
                    if(isOld) {
                        const proConfig = result1.find((i: PageConfig) => i.functionCode === r.functionCode) as PageConfig;
                        r.id = proConfig.id
                    }
                    pageConfigListByDataView.push(r)
                }
            })
            return pageConfigListByDataView

        },


        /**
         * 获取页面配置
         * @param pageConfigBase
         * @param update
         */
        async getPageConfigOption(pageConfigBase: PageConfig, update?: boolean) {
            const dictCodeStore = useDictCodeStore()
            const sendRequest = async (env: 'test' | 'prod') => {
                const {Jwt, url} = useServeStore().getServeDetails(env);
                const params = qs.stringify({
                    functionCode: pageConfigBase.functionCode,
                    parentCode: pageConfigBase.parentCode,
                })
                const headers = {Jwt}
                const errorMessage = `获取 ${env === 'test' ? '测试环境' : '正式环境'} 菜单 ====> ${pageConfigBase.parentName} ====> 页面配置 ====> ${pageConfigBase.functionName}(${pageConfigBase.functionCode})  ====> 失败`
                return await safeAwait(
                    axios.get(`${url}/crm-mdm/v1/table/columnConfig/findByParentCodeAndFunctionCodeOrderByFormorder?${params}`, {headers}),
                    errorMessage)
            }

            console.log(`获取 测试环境 菜单 ====> ${pageConfigBase.parentName} ====> 页面配置 ====> ${pageConfigBase.functionName}(${pageConfigBase.functionCode})  ====> 开始`)
            const res = await sendRequest('test')
            console.log(`获取 测试环境 菜单 ====> ${pageConfigBase.parentName} ====> 页面配置 ====> ${pageConfigBase.functionName}(${pageConfigBase.functionCode})  ====> 结束`)
            if (res.data && res.data.result) {

                res.data.result.forEach((item: any) => {
                    item.dictCode && !dictCodeStore.dictCodesUpdatable.includes(item.dictCode) && dictCodeStore.dictCodesUpdatable.push(item.dictCode)
                    delete item.id
                })
            }
            if (update) {
                return await this.startUpdatePageConfigOption(res.data.result, pageConfigBase)
            }
        },


        /**
         * 开始同步 页面配置详情 到正式环境
         * @param pageConfigDetail
         * @param pageConfigBase
         */
        async startUpdatePageConfigOption(pageConfigDetail: PageConfigDetail[], pageConfigBase: PageConfig) {
            if (!pageConfigDetail.length) {
                return;
            }
            const {Jwt, url} = useServeStore().getServeDetails('prod');
            const headers = {Jwt}
            const params = {
                functionCode: pageConfigBase.functionCode,
                parentCode: pageConfigBase.parentCode,
                mdmColumnConfigVos: pageConfigDetail
            }
            console.log(`页面配置详情  ====>  同步到正式环境 ====> ${pageConfigBase.parentName} ====> ${pageConfigBase.functionName}(${pageConfigBase.functionCode})  ====> 开始`)
            const errorMessage = `页面配置详情 ====> 同步到正式环境 ====> ${pageConfigBase.parentName} ====> ${pageConfigBase.functionName}(${pageConfigBase.functionCode})  ====> 失败`
            const res = await safeAwait(axios.post(`${url}/crm-mdm/v1/table/columnConfig/createByColumnConfigBatchCreateDto`, params, {headers}), errorMessage)
            console.log(`页面配置详情 ====> 同步到正式环境 ====> ${pageConfigBase.parentName} ====> ${pageConfigBase.functionName}(${pageConfigBase.functionCode})  ====> 结束`)
            return res
        },

        /**
         * 开始同步 页面配置基础信息 到正式环境
         * @param pageConfig
         */
        async startUpdatePageConfig(pageConfig: PageConfig) {
            const {Jwt, url} = useServeStore().getServeDetails('prod');
            const headers = {Jwt}
            const methods = pageConfig.id ? 'patch' : 'post'
            const errorMessage = `开始同步到 正式环境 页面配置 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName}(${pageConfig.functionCode}) ===> 失败`
            console.log(`开始同步到 正式环境 页面配置 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName}(${pageConfig.functionCode}) ===> 开始`)
            await safeAwait(axios[methods](`${url}/crm-mdm/v1/table/functionsub`, pageConfig, {headers}), errorMessage)
            console.log(`开始同步到 正式环境 页面配置 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName}(${pageConfig.functionCode}) ===> 结束`)
        },

    },
})

