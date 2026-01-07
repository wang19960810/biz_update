<script setup lang="ts">
import { reactive, onMounted} from "vue";
import { useDataViewStore } from "@src/store/transfer-menu";
import { useServeStore } from "@src/store/serveStoreState.ts";

import axios from "axios";

const dataViewStore = useDataViewStore();

const serveStore = useServeStore();

// 系统来源 下拉列表数据
const systemSources = reactive<{value: string[]}>({value: []})

onMounted(async () => {
  await getSystemSources()
  await dataViewStore.getDataViewTest({systemOfConfigSource: systemSources.value[0]})
})

const getSystemSources = async () => {
  const {url, jwt } = serveStore.getServeDetails('test')
  const requestUrl = `${url}/crm-mdm/v1/errorlog/errorlog/findCRMSystem`
  const res = await window.http.get(requestUrl, { headers: {Jwt: jwt}})
  console.log(res);
  systemSources.value = res.data.result;
}
</script>

<template>
  <div class="left-content">
    <div style="margin:40px 0 20px;text-align: left">
      <el-select style="width: 300px" placeholder="请选择服务">
        <el-option v-for="i in systemSources.value"  :key="i" :label="i" :value="i"></el-option>
      </el-select>
    </div>
    <el-table
        :data="dataViewStore.dataViewTableDataTest"
        ref="testMenuRef"
        row-key="id"
    >
      <el-table-column type="selection" width="55"/>
      <el-table-column prop="systemOfConfigSource" label="来源子系统"/>
      <el-table-column prop="configSourceName" label="数据视图名称"/>
      <el-table-column prop="configSource" label="数据视图编码"/>
    </el-table>
  </div>
</template>

<style scoped lang="less">

</style>