<script setup lang="ts">
import {reactive, defineEmits, ref, onMounted} from 'vue'

import { useMenuStore } from "@src/store/transfer-menu";
import { useServeStore } from '@src/store/serveStoreState.ts'

import type {MenuItem} from "../../../types";
import {ElMessage} from "element-plus";
import axios from 'axios'
import {parentFirstSort} from "@src/units/tool.ts"

const emit = defineEmits(['change'])

const menuStore = useMenuStore()

const serveStore = useServeStore()

const loading = ref(false);

// 选中 需要同步到正式环境的菜单
const selectMenu = reactive<{value: MenuItem[]}>({
  value: []
})

onMounted( async () => {
  await updateList()
})

const updateList = async () => {
  loading.value = true
  await menuStore.getUpdatedMenuList()
  loading.value = false
}

/**
 * 勾选 需要更新的 菜单
 * @param data 选中的数据
 */
const selectionChange = (data: MenuItem[]) => {
  selectMenu.value = [...data]
}

/**
 * 发起请求前
 */
const beforeMenuSubmit = (data: MenuItem) => {
  const {code, comment, sortIndex, resource, parentCode, icon} = data
  return {
    addProgress: null,
    code,
    comment,
    resource,
    sortIndex,
    parentCode,
    icon,
    functionLevel: "1",
    type: "default",
    viewItem: 1,
    tstatus: 0
  }
}

/**
 * 同步
 */
const addMenuSubmit = () => {
  const promiseArr: any[] = []
  const {prodUrl, prodJwt} = serveStore.serveInfo
  const selectMenuSort = parentFirstSort(selectMenu.value)
  selectMenuSort.forEach((i: MenuItem) =>   {
    const params = beforeMenuSubmit(i)
    promiseArr.push(axios.post(prodUrl + "/crm-mdm/v1/competences/competences", params, {
      headers: {
        Jwt: prodJwt
      }
    }))
  })

  loading.value = true
  Promise.allSettled(promiseArr).then((results) => {
    const successArr: MenuItem[] = []
    // const errorArr: MenuItem[] = []
     results.map((result) => {
      if (result.status === 'fulfilled') {
        console.log('成功:', result.value);
        successArr.push(result.value.data.data)
        return result.value.data.data
      } else {
        console.log('失败:', result.reason);
      }

    })
    selectMenu.value = []
    setHistory(successArr)
    updateList()
    ElMessage.success('菜单同步完成！')
  })
}

/**
 * 本地存储同步历史
 * @param data
 */
const setHistory = (data: MenuItem[]) => {

  const fromData = data.map((item) => ({...item}))
  let historyMenu = localStorage.getItem("historyMenu")
  let historyMenuJson: { [key: string]: MenuItem[] } = {}
  if (historyMenu) {
    historyMenuJson = JSON.parse(historyMenu)
  }

  const D = new Date();
  const date = `${D.getFullYear()}-${D.getMonth() + 1}-${D.getDate()}`;
  const dateStr = new Date(date).getTime().toString();

  if(historyMenuJson[dateStr]){ // 将当前日作为索引
    historyMenuJson[dateStr] = [...fromData, ...historyMenuJson[dateStr]]
  } else {
    historyMenuJson[dateStr] = fromData;
  }
  localStorage.setItem("historyMenu", JSON.stringify(historyMenuJson));
}
</script>

<template>
  <div v-loading="loading">
    <div class="button-content">
      <el-button type="primary"  @click="addMenuSubmit">新增</el-button>
    </div>
    <div class="menu-content">
      <el-table
          :data="menuStore.addedDataMenuList"
          :tree-props="{checkStrictly: true}"
          row-key="id"
          @selection-change="selectionChange"
      >
        <el-table-column type="selection" width="55"/>
        <el-table-column prop="comment" label="菜单名称"/>
        <el-table-column prop="code" label="菜单编码"/>
        <el-table-column prop="modifyTime" label="修改时间"/>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="less">
.button-content{
  text-align: left;
}
</style>