import {defineStore} from 'pinia'
import {useServeStore, usePageConfigStore, useMenuStore, useTransferMenuGlobalStore} from '../index.ts'
import type {DataView, DataViewInfo, MenuItem} from "../../pages/transfer-menu/types"
import axios from "axios";
import qs from "qs"
import {safeAwait} from "../../units/tool.ts"

/**
 * 数据视图
 * Represents the base interface for data views within the application.
 * Defines the foundational properties required to identify and categorize data views.
 * The configSource property specifies the unique identifier or code of the data view.
 * The systemOfConfigSource property indicates the system to which the data view belongs.
 */
interface BaseDataViews {
    configSource?: string, // 数据视图编码
    systemOfConfigSource: string // 数据视图 所属系统
    configSourceName?: string // 数据视图名称
}

interface useDataViewState {
    dataViewsUpdatable: BaseDataViews[]
    dataViewTableDataTest: DataView[]
    dataViewTableDataPro: DataView[]
    loading: boolean
}

export const useDataViewStore = defineStore('dataView', {
    state: (): useDataViewState => {
        return {
            dataViewsUpdatable: [], // 需要同步到正式环境的数据视图
            dataViewTableDataTest: [],  // 测试环境所有的数据视图
            dataViewTableDataPro: [], // 正式环境所有的数据视图
            loading: false
        }
    },
    actions: {

        /**
         * 查询正 数据视图 请求参数
         * @param dataViewBase
         */
        buildRequestParamsToGetDataView(dataViewBase: BaseDataViews) {
            return   {
                subSystem: dataViewBase.systemOfConfigSource,
                code: dataViewBase.configSource,
                configSourceName: dataViewBase.configSourceName,
                page: 0,
                size: 3000
            };
        },

        /**
         * 查询正式环境 数据视图是否存在
         * @param dataViewBase 数据视图基本信息
         * @param env 环境
         * @param menu
         */
        async getDataView(dataViewBase: BaseDataViews, env: 'test' | 'prod', menu: MenuItem) {

            const {Jwt, url} = useServeStore().getServeDetails(env);

            // 发送请求
            const sendRequest = async (url: string, headers: Record<string, string>) => {
                return axios.get(url, {headers})
            };

            const params = this.buildRequestParamsToGetDataView(dataViewBase);

            const queryString = qs.stringify(params);
            const requestUrl = `${url}/${params.subSystem}/v1/europa/europaInfos/findByConditions?${queryString}`;
            const headers = {Jwt};

            if(params.code) {
                console.log(`开始获取数据视图 ===> ${params.code} ${menu && menu.comment ? ', 涉及页面' + menu.comment : ''}`)
            }

            return await sendRequest(requestUrl, headers)

        },

        /**
         * 查询 正式环境 数据视图 , 保存数据并返回
         * @param viewDataRequest
         */
        AfterGetDataViewPro(viewDataRequest: any) {
            viewDataRequest.map((i: any) => {
                const urlToArr = i.value.config.url.split('?')
                const configData: any = qs.parse(urlToArr[1])
                let logString = `数据视图 ====> ${configData.code}`
                if (i.status === 'fulfilled' && !i.value.data.data) {
                    const dataCode = this.dataViewsUpdatable.map(i => i.configSource)

                    !dataCode.includes(configData.code) && this.dataViewsUpdatable.push({
                        configSource: configData.code,
                        systemOfConfigSource: configData.subSystem,
                        configSourceName: configData.configSourceName,
                    })
                    logString = '正式环境未存在' + logString
                    console.log(this.dataViewsUpdatable);
                } else {
                    logString = '正式环境已存在' + logString
                }
                console.log(logString)

            })
            return this.dataViewsUpdatable
        },

        /**
         * 获取的数据视图详情
         */
        async getDataViewDetail(baseDataViews: BaseDataViews, env: 'test' | 'prod') {
            const {url, Jwt} = useServeStore().getServeDetails(env)

            const sendRequest = (url: string, headers: Record<string, string>) => {
                return axios.get(url, {headers})
            }

            const requestParams = {
                subSystem: baseDataViews.systemOfConfigSource,
                code: baseDataViews.configSource,
                pageNum: 1,
                pageSize: 30,
                page: 0,
                size: 30
            }

            const requestParamsToString = qs.stringify(requestParams)

            const requestURL = `${url}/${baseDataViews.systemOfConfigSource}/v1/europa/europaInfos/findByCode?${requestParamsToString}`
            const headers = {Jwt}

            console.log(`获取 ${env === 'test' ? '测试环境' : '正式环境'} 数据视图详情 ===> ${baseDataViews.configSource} ==> 开始`)
            const res = await sendRequest(requestURL, headers)
            console.log(`获取 ${env === 'test' ? '测试环境' : '正式环境'} 数据视图详情 ===> ${baseDataViews.configSource} ==> 结束`)
            return res
        },

        /**
         * 根据菜单更新数据视图
         */
        async beforeUpDateDataViewByMenu () {

            if(!this.dataViewsUpdatable.length) {
                await usePageConfigStore().getPageConfigByMenu(useMenuStore().selectedMenu, {dataView: true})
            }
            if (this.dataViewsUpdatable.length) {
              await this.beforeUpDateDataView()
            }
        },

        /**
         * 数据视图更新
         * @param isAdd 是否确认未 正式环境未添加的数据视图
         */
        async beforeUpDateDataView(isAdd?: boolean) {
            useTransferMenuGlobalStore().loading = true
            const requestUpdateAll = this.dataViewsUpdatable.map(async (i: BaseDataViews) => {
                const resTest = await this.getDataViewDetail(i, 'test');
                delete resTest.data.data.id;
                if(!isAdd) {
                    const resPro = await this.getDataViewDetail(i, 'prod');
                    if(resPro.data.data){
                        resTest.data.data.id = resPro.data.data.id;
                    } else {
                        const {code, name, pageable, sourceType, subSystem, view} = resTest.data.data;
                        resTest.data.data = {
                            code, name, pageable, sourceType, subSystem, view
                        }
                    }
                }
                return await this.upDateDateViewToPro(resTest.data.data)

            })
            await Promise.allSettled([...requestUpdateAll])
            useTransferMenuGlobalStore().loading = false
        },



        /**
         * 同步数据视图
         * @param dataView 数据视图数据
         */
        async upDateDateViewToPro(dataView: DataViewInfo) {
            const {Jwt: proJwt, url: proUrl} = useServeStore().getServeDetails('prod');

            const methods = dataView.id ? 'patch' : 'post'
            const headersProp = {Jwt: proJwt}

            console.log(`${methods === 'post' ? '添加' : '更新'}数据视图 ====> ${dataView.code} 到正式环境 ====> 开始`)
            await safeAwait(
                axios[methods](`${proUrl}/${dataView.subSystem}/v1/europa/europaInfos`, dataView, {headers: headersProp}),
                `${methods === 'post' ? '添加' : '更新'}数据视图 ====> ${dataView.code} 到正式环境 ====> 失败`
            )
            console.log(`${methods === 'post' ? '添加' : '更新'}数据视图 ====> ${dataView.code} 到正式环境 ====> 结束`)
        },
    }


})