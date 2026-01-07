<script setup lang="ts">
import {onMounted, reactive, ref } from 'vue'
import { useServeStore } from "@src/store/serveStoreState.ts";
import type {MenuItem} from "../../../types";
import axios from 'axios'

const serveStore = useServeStore()

const dataAll = reactive<{ value: any }>({value: {}}) // 所有的历史数据

const dataKey = ref<string>("") // 筛选菜单对象的key

const date = ref<string>("") // 选择的日期

// 选中 需要同步到正式环境的菜单
const selectMenu = reactive<{ value: MenuItem[] }>({
  value: []
})

/**
 * 勾选 需要更新的 菜单
 * @param data 选中的数据
 */
const selectionChange = (data: MenuItem[]) => {
  selectMenu.value = [...data]
}

/**
 * 获取数据key
 */
const getDataKey = () => {
  dataKey.value = new Date(date.value).getTime().toString()
  selectMenu.value = []
}

onMounted(() => {
  const historyMenu = localStorage.getItem("historyMenu")
  dataAll.value = historyMenu && JSON.parse(historyMenu);

  const d = new Date()
  date.value = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  getDataKey()
})

/**
 * 启禁用菜单
 * @param code
 * @param flag
 */
const updateStatus = (code: string, flag: boolean) => {
  const {prodJwt, prodUrl} = serveStore.serveInfo
  return  axios.post(prodUrl + "/crm-mdm/v1/competences/competences/updateStatus", {code, flag}, {
    headers: {
      Jwt: prodJwt
    }
  })
}

/**
 * 启禁用前
 */
const beforeUpdateStatus = (flag: boolean) => {
  const requests: any[] = []
  selectMenu.value.forEach((item: MenuItem) => {
    requests.push(updateStatus(item.code, flag))
  })

  Promise.allSettled(requests).then(results => {
    results.map((result) => {
      if (result.status === 'fulfilled') {
        console.log('成功:', result.value);
      } else {
        console.log('失败:', result.reason);
      }
    })
  })
}
</script>

<template>
  <div class="header-box">
    <el-date-picker
        @change="getDataKey"
        v-model="date"
        type="date"
        placeholder="选择日期">
    </el-date-picker>
  </div>
  <div class="header-box">
    <el-button type="primary" @click="beforeUpdateStatus(true)">启用</el-button>
    <el-button type="primary" @click="beforeUpdateStatus(false)">禁用</el-button>
  </div>
  <div class="menu-content">
    <el-table
        :data="dataAll.value ?  dataAll.value[dataKey]  : []"
        :tree-props="{checkStrictly: true}"
        row-key="id"
        @selection-change="selectionChange"
    >
      <el-table-column type="selection" width="55"/>
      <el-table-column prop="comment" label="菜单名称"/>
      <el-table-column prop="code" label="菜单编码"/>
    </el-table>
  </div>
</template>

<style scoped lang="less">
.header-box {
  text-align: left;
  margin-bottom: 20px;
}
</style>