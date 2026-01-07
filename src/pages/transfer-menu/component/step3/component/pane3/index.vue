<script setup lang="ts">
import { onMounted, ref} from 'vue'
import {usePageConfigStore, useDataViewStore} from "@src/store/transfer-menu";

const pageConfigStore = usePageConfigStore(); // 页面配置

const dataViewStore = useDataViewStore(); // 数据视图

const loading = ref<boolean>(false);

onMounted(async () => {
  console.log('loading')
  await pageConfigStore.getPageConfigByMenu([{
    buttons: null,
    code: "CRM2025060600000002",
    comment: "发货单明细",
    competenceCode: "CRM2025060600000002",
    createAccount: null,
    description: null,
    extractUri: 0,
    icon: "iconzhongduanmendianjifenduihuandanguanli",
    id: "de445cc3-3787-4b24-a67b-7f55d5a27dad",
    parentCode: "CRM202506060958542566",
    resource: "/oms/shipments_order_info",
    roleCodes: null,
    sortIndex: 2,
    tag: "",
    tstatus: 0,
    type: "default",
    viewItem: 1
  }, {
    code: "CRM20250606000000001",
    comment: "零售单明细"
  }])
  console.log('loading')
})
</script>

<template>
  <el-table :data="dataViewStore.addedDataViews" v-loading="loading" border style="width: 100%">
    <el-table-column prop="systemOfConfigSource" label="来源子系统"/>
    <el-table-column prop="configSourceName" label="数据视图名称"/>
    <el-table-column prop="configSource" label="数据视图编码"/>
  </el-table>
</template>

<style scoped lang="less">

</style>