<script setup lang="ts">
import {onMounted, ref} from 'vue'
import { useDictCodeStore } from "@src/store/transfer-menu";
import { useServeStore } from "@src/store/index";
import {Calendar} from "@element-plus/icons-vue";

import axios from "axios";

import pane1 from "./component/pane1/index.vue"
import pane2 from "./component/pane2/index.vue"

const dictCodeStore = useDictCodeStore()
const serveStore = useServeStore()


const activeName = ref<string>("testAddTable");

/**
 * 获取数据来源下拉列表
 */
const getSystemSources = async () => {
  const {Jwt, url} = serveStore.getServeDetails('test')
  const res = await axios.get(`${url}/crm-mdm/v1/dictionary/dictdata/findContainExtendByConditions?dictTypeCode=module_group&pageSize=50`, {headers: {Jwt}})
  dictCodeStore.systemSource = res.data.result
}

onMounted(() => {
  getSystemSources()
})

</script>

<template>

  <el-tabs type="border-card"  v-model="activeName" class="demo-tabs">
    <el-tab-pane label="可新增数据字典" name="testAddTable">
      <pane1 v-if="activeName === 'testAddTable'"></pane1>
    </el-tab-pane>
    <el-tab-pane label="测试环境数据" name="testTable">
      <pane2 v-if="activeName === 'testTable'"></pane2>
    </el-tab-pane>
    <el-tab-pane label="操作历史" name="history-menu">
      <template #label>
        <span class="custom-tabs-label">
          <el-icon><calendar /></el-icon>
          <span>操作历史</span>
        </span>
      </template>
<!--      <HistoryMenu></HistoryMenu>-->
    </el-tab-pane>
  </el-tabs>



</template>

<style scoped lang="less">

</style>