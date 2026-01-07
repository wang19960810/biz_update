<script setup lang="ts">
import {ref} from 'vue'
import { useDataViewStore } from "@src/store/transfer-menu";
import {Calendar} from "@element-plus/icons-vue";
import pane1 from "./component/pane1/index.vue"
import pane2 from "./component/pane2/index.vue"

const dataViewStore = useDataViewStore()


const activeName = ref<string>("testAddTable");

</script>

<template>

  <el-tabs type="border-card" v-loading="dataViewStore.loading" v-model="activeName" class="demo-tabs">
    <el-tab-pane label="可新增数据视图" name="testAddTable">
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