<script setup lang="ts">
import { reactive, onMounted } from "vue";
import axios from "axios";
import { useDataViewStore } from "@src/store/transfer-menu";
import { useServeStore } from "@src/store/serveStoreState.ts";

const dataViewStore = useDataViewStore();

const serveStore = useServeStore();

// 绯荤粺鏉ユ簮 涓嬫媺鍒楄〃鏁版嵁
const systemSources = reactive<{ value: string[] }>({ value: [] })

onMounted(async () => {
  await getSystemSources()
  await getDataViews()
})

const getSystemSources = async () => {
  const { url, Jwt } = serveStore.getServeDetails('test')
  const requestUrl = `${url}/crm-mdm/v1/errorlog/errorlog/findCRMSystem`
  const res = await axios.get(requestUrl, { headers: { Jwt } })
  systemSources.value = res.data.result || []
}

const getDataViews = async () => {
  if (!systemSources.value.length) {
    dataViewStore.dataViewTableDataTest = []
    return
  }

  const res = await dataViewStore.getDataView(
    { systemOfConfigSource: systemSources.value[0] },
    'test'
  )

  dataViewStore.dataViewTableDataTest = res?.data?.data?.content || []
}
</script>

<template>
  <div class="left-content">
    <div style="margin:40px 0 20px;text-align: left">
      <el-select style="width: 300px" placeholder="璇烽€夋嫨鏈嶅姟">
        <el-option v-for="i in systemSources.value" :key="i" :label="i" :value="i"></el-option>
      </el-select>
    </div>
    <el-table
      :data="dataViewStore.dataViewTableDataTest"
      row-key="id"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="systemOfConfigSource" label="鏉ユ簮瀛愮郴缁?" />
      <el-table-column prop="configSourceName" label="鏁版嵁瑙嗗浘鍚嶇О" />
      <el-table-column prop="configSource" label="鏁版嵁瑙嗗浘缂栫爜" />
    </el-table>
  </div>
</template>

<style scoped lang="less">

</style>
