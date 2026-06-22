<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { instance } from "@src/server/index.ts";
import { useDataViewStore } from "@src/store/transfer-menu";
import { useServeStore } from "@src/store/serveStoreState.ts";
import type { DataViewInfo } from "../../../../types/index";

const dataViewStore = useDataViewStore();

const serveStore = useServeStore();

// 绯荤粺鏉ユ簮 涓嬫媺鍒楄〃鏁版嵁
const systemSources = reactive<{ value: string[] }>({ value: [] })

// 鍒楄〃鏁版嵁
const newlyAddedData = reactive<{ value: DataViewInfo[] }>({ value: [] })

// 鍒楄〃鏄剧ず鏁版嵁
const tableData = reactive<{ value: DataViewInfo[] }>({ value: [] })

// 鍒嗛〉鍙傛暟
const paginationParam = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

/**
 * 鑾峰彇鏁版嵁鏉ユ簮涓嬫媺鍒楄〃
 */
const getSystemSources = async () => {
  const { Jwt, url } = serveStore.getServeDetails('test')
  const res = await instance.get(`${url}/crm-mdm/v1/errorlog/errorlog/findCRMSystem`, { headers: { Jwt } })
  systemSources.value = res.data.result || []
}

/**
 * 鏍规嵁 绯荤粺 璇锋眰鏁版嵁瑙嗗浘鍒楄〃
 * @param dataView
 */
const getDataViewBySystemSource = async (dataView: string[]) => {
  dataViewStore.loading = true

  const getDataViewRequestForTest = dataView.map(async (item) => {
    return await dataViewStore.getDataView({
      systemOfConfigSource: item
    }, 'test')
  })
  const allTest = await Promise.allSettled(getDataViewRequestForTest)

  let dataAllTest: DataViewInfo[] = []
  allTest.forEach((item) => {
    if (item.status === "fulfilled" && item.value.data.data) {
      dataAllTest = [...dataAllTest, ...item.value.data.data.content]
    }
  })

  const getDataViewRequestForPro = dataView.map(async (item) => {
    return await dataViewStore.getDataView({
      systemOfConfigSource: item
    }, 'prod')
  })
  const allPro = await Promise.allSettled(getDataViewRequestForPro)
  let dataAllPro: DataViewInfo[] = []
  allPro.forEach((item) => {
    if (item.status === "fulfilled" && item.value.data.data) {
      dataAllPro = [...dataAllPro, ...item.value.data.data.content]
    }
  })

  filterDataViewsAdded(dataAllTest, dataAllPro)
  dataViewStore.loading = false
}

/**
 * 杩囨护鍑?闇€瑕佹柊澧炵殑鍒楄〃
 * @param dataViewTestAll
 * @param dataViewProAll
 */
const filterDataViewsAdded = (dataViewTestAll: DataViewInfo[], dataViewProAll: DataViewInfo[]) => {
  const dataViewProCode = dataViewProAll.map((item) => item.code)
  newlyAddedData.value = dataViewTestAll.filter(item => !dataViewProCode.includes(item.code))
  paginationParam.total = newlyAddedData.value.length
  handleSizeChange(paginationParam.pageSize)
}

/**
 * 鍒囨崲姣忛〉鏄剧ず鏁伴噺
 * @param size
 */
const handleSizeChange = (size: number) => {
  paginationParam.pageSize = size
  tableData.value = newlyAddedData.value.slice(size * (paginationParam.currentPage - 1), size * paginationParam.currentPage)
}

/**
 * 鍒囨崲椤垫暟
 */
const handleCurrentChange = (page: number) => {
  paginationParam.currentPage = page
  tableData.value = newlyAddedData.value.slice(paginationParam.pageSize * (page - 1), page * paginationParam.pageSize)
}

/**
 * 鍕鹃€?闇€瑕佹洿鏂扮殑 鏁版嵁
 * @param data 閫変腑鐨勬暟鎹?
 */
const selectionChange = (data: DataViewInfo[]) => {
  dataViewStore.dataViewsUpdatable = data.map((item) => ({
    configSource: item.code,
    systemOfConfigSource: item.subSystem,
    configSourceName: item.name
  }))
}

onMounted(async () => {
  await getSystemSources();
  await getDataViewBySystemSource(systemSources.value)
})
</script>

<template>
  <div class="left-content">
    <div style="margin: 0 0 10px;text-align: left">
      <el-button type="primary" @click="dataViewStore.beforeUpDateDataView(true)">鍚屾</el-button>
    </div>
    <el-table
      :data="tableData.value"
      @selection-change="selectionChange"
      row-key="id"
      border
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="subSystem" label="鏉ユ簮瀛愮郴缁?" width="220" />
      <el-table-column prop="code" label="鏁版嵁瑙嗗浘缂栫爜" />
      <el-table-column prop="name" label="鏁版嵁瑙嗗浘鍚嶇О" />
    </el-table>
    <div style="display:flex;justify-content:flex-end;margin-top: 20px">
      <el-pagination
        v-model:current-page="paginationParam.currentPage"
        v-model:page-size="paginationParam.pageSize"
        :page-sizes="[10, 20, 30, 40]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="paginationParam.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped lang="less">

</style>
