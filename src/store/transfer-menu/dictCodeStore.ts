import {defineStore} from 'pinia'
import { useServeStore, usePageConfigStore, useTransferMenuGlobalStore } from "../index.ts"
import {safeAwait} from "../../units/tool.ts"  // 确保路径和文件名正确

import type {DictCodeOptions, DictCode} from "../../pages/transfer-menu/types"

import axios from "axios";
import qs from "qs"

/**
 * 数据字典
 */

interface DictCodeState{
    dictCodesUpdatable: string[],
    newlyAddedDictCodeData: DictCode[],
    dictCodeOfTest: DictCode[],
    systemSource: Array<{dictCode: string, dictValue: string}>
}
export const useDictCodeStore = defineStore('dictCodeStore', {
    state:  (): DictCodeState => {
        return {
            systemSource: [], // 系统来源
            dictCodesUpdatable: [], // 需要 更新/新增 的数据字典
            newlyAddedDictCodeData: [], // 新增的数据字典 (用于列表展示)
            dictCodeOfTest: [], // 测试环境数据字典
        }
    },
    actions: {

        /**
         * 查询数据字典之前
         * @param type add: 新增未添加的  update: 更新所有
         */
        async beforeUpdateDictCodes(type: 'add' | 'update'  = 'update') {
            if(this.dictCodesUpdatable.length === 0) {
                await this.fetchPageConfigs()
            }
            if(!this.dictCodesUpdatable.length) {
                console.log(`暂无数据字典更新 ======>`)
            }

            useTransferMenuGlobalStore().loading = true
            try {
                await Promise.allSettled(
                    this.dictCodesUpdatable.map(code => this.handleResourceOperationTheBaseInfo(code, type))
                )
            } finally {
                useTransferMenuGlobalStore().loading = false
            }
        },

        /**
         * 获取页面配置
         */
        async fetchPageConfigs() {
            const pageConfigStore = usePageConfigStore()
            await pageConfigStore.getPageConfigByMenu() // 获取功能列表
            const requestAll = pageConfigStore.updatablePageConfigs.map(
                item => pageConfigStore.getPageConfigOption(item)
            )
            await Promise.allSettled(requestAll)
        },

        /**
         * 通过类型处理
         * @param code
         * @param operationType add: 新增未添加的  update: 更新所有
         */
        async handleResourceOperationTheBaseInfo(code: string, operationType: string) {

            let isAdd = false; // 是否为新增的数据字典

            if(operationType === 'add') {
                isAdd = await this.addResource(code)
            }

            if(operationType === 'update') {
                isAdd = await this.updateResource(code)
            }

            await this.getDictCodeOptions(code, isAdd)
        },

        /**
         * 数据字典 - 更新
         * code
         */
        async updateResource(code: string) {
            const proData = await this.getItemDictCodeByEnv(code, 'prod')
            if(!proData) {
                await this.addResource(code)
                return true
            } else {
                const testData = await this.getItemDictCodeByEnv(code, 'test')
                const keys = ['dictTypeCode', 'dictTypeDesc', 'dictTypeModule', 'dictTypeModuleName', 'dictTypeName', 'enableStatus']
                const isDifference = keys.some((key: string) => proData[key as keyof DictCode]  !== testData[key as keyof DictCode])
                testData.id = proData.id
                isDifference ? await this.updateDictCode(testData) : console.log(`数据字典 ===> ${code} ==> 基础信息暂无更新!`)
                return false
            }
        },

        /**
         * 数据字典 - 新增
         * code
         */
        async addResource(code: string) {
            const testData = await this.getItemDictCodeByEnv(code, 'test')
            delete testData.id
            await this.updateDictCode(testData)
            return true
        },

        /**
         * 获取数据字典
         * @param code
         * @param env
         */
        async getItemDictCodeByEnv(code: string, env: 'test' | 'prod'): Promise<DictCode> {
            const {url, Jwt} = useServeStore().getServeDetails(env)

            const requestParams = {
                dictTypeCode: code,
                pageNum: 1,
                pageSize: 30,
                page: 1,
                size: 30
            }

            const requestParamsToString = qs.stringify(requestParams)

            const sendRequest = (url: string, headers: Record<string, string>) => {
                return axios.get(url, {headers})
            }

            const requestURLTest = `${url}/crm-mdm/v1/dictionary/dicttype/findByConditions?${requestParamsToString}`
            const headersTest = {Jwt}

            console.log(`查询 ${ env === 'prod' ? '正式环境' : '测试环境' }数据字典 ===> ${code} ==> 开始`)
            const resData = await safeAwait(sendRequest(requestURLTest, headersTest), `查询 ${ env === 'prod' ? '正式环境' : '测试环境' }数据字典 ===> ${code} ==> 请求失败`)
            const dictData = resData.data.result.records.find((r:DictCode) => r.dictTypeCode === code)
            console.log(`查询 ${ env === 'prod' ? '正式环境' : '测试环境' }数据字典 ===> ${code} ==> 结束`)

            return dictData
        },

        /**
         * 更新数据字典
         * @param dictCode
         */
        async updateDictCode(dictCode: DictCode) {
            const {url, Jwt} = useServeStore().getServeDetails('prod')
            const methods = dictCode.id ? 'patch' : 'post'
            console.log(`${dictCode.id ? '更新' : '新增'} 正式环境 数据字典 ===> ${dictCode.dictTypeCode} ===> 开始`)
            await safeAwait(axios[methods](`${url}/crm-mdm/v1/dictionary/dicttype`, dictCode, {headers: {Jwt}}), `${dictCode.id ? '更新' : '新增'} 正式环境 数据字典配置 ===> ${dictCode.dictTypeCode} ===> 失败`)
            console.log(`${dictCode.id ? '更新' : '新增'} 正式环境 数据字典 ===> ${dictCode.dictTypeCode} ===> 结束`)
        },

        /**
         * 获取数据字典配置
         * @param code
         * @param isAdd 是否为 新增的数据字典
         */
        async getDictCodeOptions(code: string, isAdd: boolean) {
            const {url: urlTest, Jwt: jwtTest} = useServeStore().getServeDetails('test')
            const {url: urlPro, Jwt: jwtPro} = useServeStore().getServeDetails('prod')
            const requestParams = {
                dictTypeCode: code,
                pageNum: 1,
                pageSize: 30,
                page: 1,
                size: 30
            }

            const requestParamsToString = qs.stringify(requestParams)
            const headers = {Jwt: jwtTest}
            const headersPao = {Jwt: jwtPro}

            const sendRequest = async (url: string, headers: Record<string, string>, errorMessage: string) => {
                return safeAwait(axios.get(`${url}/crm-mdm/v1/dictionary/dictdata/findTreeByDictTypeCode?${requestParamsToString}`, {headers}), errorMessage)
            }

            const logStart = (env: string) => console.log(`查询 ${env} 数据字典配置 ===> ${code} ==> 开始`);
            const logEnd = (env: string) => console.log(`查询 ${env} 数据字典配置 ===> ${code} ==> 结束`);


            logStart('测试环境')
            const resTest = await sendRequest(urlTest, headers, `查询 测试环境 数据字典配置 ===> ${code} ==> 请求失败`)
            logEnd(`测试环境`)

            let updateData = resTest.data.result.records

            let deleteData: any[] = []
            if(!isAdd) { // 非测试环境 新增的数据字典 查询正式环境的 数据字典配置详情 匹配测试环境数据 有更新再更新
                logStart(`正式环境`)
                const resPro = await sendRequest(urlPro, headersPao, `查询 正式环境 数据字典配置 ===> ${code} ==> 请求失败`)
                logEnd(`正式环境`)

                const proRecords = resPro.data.result.records || []

                const testDictCodeOption = this.flattenTreeFlatMapDictCodeOption(updateData)
                const proDictCodeOption = this.flattenTreeFlatMapDictCodeOption(proRecords)
                const proDictCode = this.flattenTreeFlatMapProCodes(proRecords)
                const testDictCode = this.flattenTreeFlatMapProCodes(updateData)
                // 寻找是否有差异化数据
                updateData = this.filterAndUpdateDictCodeOptions(testDictCodeOption, proDictCodeOption, proDictCode);

                // 寻找测试环境 删除了的 数据字典
                deleteData = proDictCodeOption.filter((item: DictCodeOptions) => {
                    const code = `${item.path},${item.dictValue}`;
                    return !testDictCode.includes(code);
                });
            } else {
                updateData.forEach((item:DictCodeOptions) => delete item.id)
            }


            if(updateData.length === 0 && deleteData.length === 0) {
                console.log(`数据字典 ===> ${code} ==> 配置暂无更新！`)
                return
            }

            let updateDictCodeOptionRequest: any[] = [];
            let deleteDictCodeOptionRequest: any[] = [];

            if(updateData.length) {
                updateDictCodeOptionRequest = updateData.map(async (record: DictCodeOptions) => {
                    return await this.updateDictCodeOptions(record)
                })
            }

            if(deleteData.length) {
                deleteDictCodeOptionRequest = deleteData.map(async (record: DictCodeOptions) => {
                    // return await this.deleteDictCode(record)
                })
            }

            const resAll = await Promise.allSettled([...updateDictCodeOptionRequest, ...deleteDictCodeOptionRequest])
            console.log(`正式环境 数据字典配置 ===> ${code} ==> 更新完毕！`)
            return resAll
        },

        /**
         * 删除数据字典配置
         * @param codeOptions
         */
        async deleteDictCode(codeOptions: DictCodeOptions) {
            const {url, Jwt} = useServeStore().getServeDetails('prod')
            const headers =  {Jwt}
            const errorMessage = `删除 正式环境 数据字典配置 ===> ${codeOptions.dictTypeCode} ${codeOptions.parentDictCode ? '=>' + codeOptions.parentDictCode + '=>' : '=>'} ${codeOptions.dictCode} ===> 失败`
            const logMessage = (node: string) => console.log(`删除 正式环境 数据字典配置 ===> ${codeOptions.dictTypeCode} ${codeOptions.parentDictCode ? '=>' + codeOptions.parentDictCode + '=>' : '=>'} ${codeOptions.dictCode} ===> ${node}`)
            logMessage('开始')
            await safeAwait(axios.delete(`${url}/crm-mdm/v1/dictionary/dictdata?ids=${codeOptions.id}`, {headers}), errorMessage)
            logMessage('结束')
        },

        /**
         * 更新数据字典配置
         * @param codeOptions
         */
        async updateDictCodeOptions(codeOptions: DictCodeOptions) {
            const {url, Jwt} = useServeStore().getServeDetails('prod')
            const methods = codeOptions.id ? 'patch' : 'post'
            console.log(`更新 正式环境 数据字典配置 ===> ${codeOptions.dictTypeCode} ${codeOptions.parentDictCode ? '=>' + codeOptions.parentDictCode + '=>' : '=>'} ${codeOptions.dictCode} ===> 开始`)
            await safeAwait(axios[methods](`${url}/crm-mdm/v1/dictionary/dictdata`, codeOptions, {headers: {Jwt}}), `更新 正式环境 数据字典配置 ===> ${codeOptions.dictTypeCode}  ${codeOptions.parentDictCode ? '=>' + codeOptions.parentDictCode + '=>' : ''}  => ${codeOptions.dictCode} ===> 失败`)
            console.log(`更新 正式环境 数据字典配置 ===> ${codeOptions.dictTypeCode} ${codeOptions.parentDictCode ? '=>' + codeOptions.parentDictCode + '=>' : '=>'} => ${codeOptions.dictCode} ===> 结束`)
        },

        /**
         * 获取数据字典列表（正式和测试）
         * @param params
         */
        async getDictCodeTypeAll(params = {}) {
            const {url: urlTest, Jwt: jwtTest} = useServeStore().getServeDetails('test')
            const {url: urlPro, Jwt: jwtPro} = useServeStore().getServeDetails('prod')
            const requestParams = {
                dictTypeName: "",
                dictTypeCode: "",
                dictTypeModule: "" ,
                page: 1,
                size: 10000,
                ...params,
            }

            const requestParamsToString = qs.stringify(requestParams)
            const headers = {Jwt: jwtTest}
            const headersPao = {Jwt: jwtPro}

            const sendRequest = async (url: string, headers: Record<string, string>) => {
                return safeAwait(axios.get(`${url}/crm-mdm/v1/dictionary/dicttype/findByConditions?${requestParamsToString}`, {headers}))
            }

            const resResultTest = await sendRequest(urlTest, headers)
            const resResultPro = await sendRequest(urlPro, headersPao)

            const testData = resResultTest.data.result.records
            const proData = resResultPro.data.result.records

            this.dictCodeOfTest = testData
            this.filterNewlyAddedData(testData, proData)

        },

        /**
         * 过滤出 新增的数据
         * @param testData
         * @param proData
         */
        filterNewlyAddedData(testData: DictCode[], proData: DictCode[]) {
            const typeCodePro = proData.map((i:DictCode) => i.dictTypeCode )
            this.newlyAddedDictCodeData = testData.filter((i:DictCode) => !typeCodePro.includes(i.dictTypeCode))
        },

        /**
         * 根据所提供的专业字典代码和选项更新字典代码选项
         * @param {DictCodeOptions[]} dictCodeOption1
         * @param {DictCodeOptions[]} dictCodeOption2
         * @param {string[]} dictCodes
         * @return {DictCodeOptions[]}
         */
        filterAndUpdateDictCodeOptions (dictCodeOption1: DictCodeOptions[], dictCodeOption2: DictCodeOptions[], dictCodes: string[]): DictCodeOptions[] {
            return dictCodeOption1.filter((item: DictCodeOptions) => {
                delete item.id;
                const code = `${item.path},${item.dictValue}`;

                const findPro = dictCodeOption2.find((itemPro: DictCodeOptions) => itemPro.path === item.path);
                if (findPro) { // 如果找到赋值id更新
                    item.id = findPro.id;
                } else { // 未找到直接返回
                    return item
                }

                return !dictCodes.includes(code);
            });
        },

        /**
         * 扁平化 测试环境 数据字典详情树
         * @param tree
         */
        flattenTreeFlatMapDictCodeOption (tree: DictCodeOptions[]): DictCodeOptions[] {
            return tree.flatMap(node => [node, ...this.flattenTreeFlatMapDictCodeOption(node.children || [])])
        },

        /**
         * 正式环境 数据字典详情 的 配置编码集合
         * @param tree
         */
        flattenTreeFlatMapProCodes (tree: DictCodeOptions[]): string[] {
            return tree.flatMap(node => [`${node.path},${node.dictValue}` , ...this.flattenTreeFlatMapProCodes(node.children || [])]);
        },


    }
})
