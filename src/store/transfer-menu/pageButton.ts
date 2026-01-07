import {defineStore} from 'pinia'
import { useServeStore, usePageConfigStore, useTransferMenuGlobalStore } from "../index.ts"
import {safeAwait} from "../../units/tool.ts"  // 确保路径和文件名正确

import type { PageButton, PageConfig } from "../../pages/transfer-menu/types"

import axios from "axios";
import qs from "qs"

/**
 * 数据字典
 */

interface PageButtonState{
    buttons: PageButton[],
}
export const usePageButtonStore = defineStore('pageButtonStore', {
    state:  (): PageButtonState => {
        return {
            buttons: []
        }
    },
    actions: {

        /**
         * 更新button之前
         * @param type add: 新增未添加的  update: 更新所有
         */
        async beforeUpDatePageButton(type: string) {
            const pageConfigStore = usePageConfigStore()

            if(!pageConfigStore.updatablePageConfigs.length) {
                await pageConfigStore.getPageConfigByMenu()
            }
            const updatablePageConfigs = pageConfigStore.updatablePageConfigs
            if( updatablePageConfigs.length) {
                useTransferMenuGlobalStore().loading = true

                const requestUpdateAll = updatablePageConfigs.map(async (item: PageConfig) => {
                    await this.getButtonsByPageConfig(item)
                })
                
                await Promise.allSettled([...requestUpdateAll])
                useTransferMenuGlobalStore().loading = false
            }
        },

        /**
         * 根据页面配置获取按钮
         * @param pageConfig
         */
        async getButtonsByPageConfig(pageConfig: PageConfig) {
            const {url, Jwt} = useServeStore().getServeDetails('prod')
            const {url: testUrl, Jwt: jwtTest} = useServeStore().getServeDetails('test')

            const requestParams = {
                functionCode: pageConfig.functionCode,
                parentCode: pageConfig.parentCode,
                pageNum: 1,
                pageSize: 30,
                page: 1,
                size: 30
            }

            const requestParamsToString = qs.stringify(requestParams)

            const sendRequest = (url: string, headers: Record<string, string>) => {
                return axios.get(url, {headers})
            }

            const requestURL = `${url}/crm-mdm/v1/table/buttonConfig/findByParentCodeAndFunctionCodePage?${requestParamsToString}`
            const requestURLTest = `${testUrl}/crm-mdm/v1/table/buttonConfig/findByParentCodeAndFunctionCodePage?${requestParamsToString}`
            const headers = {Jwt}
            const headersTest = {Jwt: jwtTest}

            console.log(`查询 测试环境 按钮列表 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> 开始`)
            const resTest = await safeAwait(sendRequest(requestURLTest, headersTest), `查询 测试环境 按钮列表 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> 失败`)
            console.log(`查询 测试环境 按钮列表 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> 结束`)

            console.log(`查询 正式环境 按钮列表 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> 结束`)
            const resPro = await safeAwait(sendRequest(requestURL, headers), `查询 正式环境 按钮列表 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> 失败`)
            console.log(`查询 正式环境 按钮列表 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> 结束`)

            const buttonsData = this.getUpDatePageButtonData(resTest.data.result.records, resPro.data.result.records)

            buttonsData.updateButtons.map(async (button) => {
                button.code = `${button.parentCode}@${button.functionCode}@${button.buttonCode}`
                button.type = "PAGE_ENGINE"
                button.name = button.buttonName
               return await this.submitUpdateButton(button, pageConfig)
            })

            buttonsData.deletedButtons.map(async (button: PageButton) => {
                return await this.submitDeleteButton(button, pageConfig)
            })
        },

        /**
         * 获取需要更新的buttons数据
         * @param buttons1
         * @param buttons2
         */
        getUpDatePageButtonData(buttons1: PageButton[], buttons2: PageButton[]) {
            const buttonsCodeTest: string[] = buttons1.map((button) => button.buttonCode)
            const buttonsCodePro: string[] = buttons2.map((button) => button.buttonCode)

            // 新增的按钮
            let buttonAdded = buttons1.filter((button: PageButton) => !buttonsCodePro.includes(button.buttonCode))
            buttonAdded.forEach((button:PageButton) => {
                delete button.id
                delete button.buttonId
            })

            // 更新的按钮
            let buttonUpdated = buttons1.filter((button: PageButton) => { // 已存在的按钮 将正式环境id 赋值给测试环境 进行更新
                if(buttonsCodePro.includes(button.buttonCode)){
                    const matchedButton = buttons2.find((buttonPro:PageButton) => buttonPro.buttonCode === button.buttonCode) as PageButton
                    button.id = matchedButton.id
                    button.buttonId = matchedButton.buttonId
                    button.pageEngineButtonId = matchedButton.pageEngineButtonId
                    return button
                }
            })

            // 测试环境删除的按钮
            let deletedButtons = buttons2.filter((button: PageButton) => !buttonsCodeTest.includes(button.buttonCode))

            return {
                updateButtons:  [...buttonUpdated, ...buttonAdded],
                deletedButtons
            }

        },

        /**
         * 提交按钮更新
         * @param button
         * @param pageConfig
         */
        async submitUpdateButton(button: PageButton, pageConfig: PageConfig) {
            const {url, Jwt} = useServeStore().getServeDetails('prod')
            const methods =  button.id ? 'patch' : 'post'
            let action = button.id ? '更新' : '新增'
            console.log(`${action} 正式环境 按钮 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> ${button.buttonName} ===> 开始`)
            await safeAwait(axios[methods](`${url}/crm-mdm/v1/competences/buttons`, button, {headers: {Jwt}}), `${action} 正式环境 按钮 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> ${button.buttonName} ===> 失败`)
            console.log(`${action} 正式环境 按钮 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> ${button.buttonName} ===> 结束`)
        },

        /**
         * 删除按钮
         * @param button
         * @param pageConfig
         */
        async submitDeleteButton(button: PageButton, pageConfig: PageConfig) {
            const {url, Jwt} = useServeStore().getServeDetails('prod')
            console.log(`删除 正式环境 按钮 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> ${button.buttonName} ===> 开始`)
            await safeAwait(axios.delete(`${url}/crm-mdm/v1/competences/buttons/deleteByCode?id=${button.id}&code=${button.code}`, {headers: {Jwt}}), `删除 正式环境 按钮 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> ${button.buttonName} ===> 失败`)
            console.log(`删除 正式环境 按钮 ===> ${pageConfig.parentName} ===> ${pageConfig.functionName} ===> ${button.buttonName} ===> 结束`)
        },

    }
})
