<template>
<!--  <h2>导出系统</h2>-->
  <el-steps :active="transferMenuGlobalStore.activeIndex" finish-status="success" align-center>
    <el-step v-for="(i, index) in transferMenuGlobalStore.stepsArray"
             :key="index"
             :title="i.title"
             :description="i.describe"
             @click="cutStep(index + 1)"/>
  </el-steps>

  <div class="step-content">
    <!--    基础数据-->
    <Step1 v-if="transferMenuGlobalStore.activeIndex === 1"  @submit="submit1"></Step1>
    <!--    菜单-页面配置-->
    <Step2 v-if="serveStore.serveInfo && transferMenuGlobalStore.activeIndex === 2"></Step2>
    <!--    数据视图-->
    <Step3 v-if="serveStore.serveInfo && transferMenuGlobalStore.activeIndex === 3"></Step3>
    <!--    数据字典-->
    <Step4 v-if="serveStore.serveInfo && transferMenuGlobalStore.activeIndex === 4"></Step4>
  </div>
</template>

<script setup lang="ts">
import {onMounted} from "vue"
import { ElMessage } from "element-plus"
import type { Serve } from "@src/types/serve"
import { useTransferMenuGlobalStore } from "@src/store/transfer-menu";
import { useServeStore } from "@src/store/serveStoreState.ts";

import Step1 from "./component/step1/index.vue"
import Step2 from "./component/step2/index.vue"
import Step3 from "./component/step3/index.vue"
import Step4 from "./component/step4/index.vue"

const serveStore = useServeStore() // 服务

const transferMenuGlobalStore = useTransferMenuGlobalStore() // 全局参数

onMounted(() => {
  transferMenuGlobalStore.activeIndex = Number(localStorage.getItem("active") || '1')

  const BD = localStorage.getItem("serveInfo")
  if(BD) {
    serveStore.serveInfo = BD && JSON.parse(BD)
  }
})

/**
 * 步骤一提交
 * @param data
 */
const submit1 = (data: Serve) => {
  localStorage.setItem('serveInfo', JSON.stringify(data))
  cutStep(transferMenuGlobalStore.activeIndex + 1)
}

/**
 * 点击顶部切换步骤
 * @param value
 */
const cutStep = (value: number) => {
  if(value > 1 && !serveStore.serveInfo) {
    ElMessage.error("请填写服务信息！")
    return
  }
  transferMenuGlobalStore.activeIndex = value
  localStorage.setItem('active',  transferMenuGlobalStore.activeIndex.toFixed())
}



</script>

<style scoped lang="less">

.step-content {
  padding: 50px;
}
</style>