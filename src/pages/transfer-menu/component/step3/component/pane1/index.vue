<script setup lang="ts">
import {reactive, onMounted, ref} from "vue";
import {useDataViewStore} from "@src/store/transfer-menu";
import {useServeStore} from "@src/store/serveStoreState.ts"
import type { DataView, DataViewInfo } from "../../../../types/index"
import axios from "axios";

const dataViewStore = useDataViewStore();

const serveStore = useServeStore();

// 系统来源 下拉列表数据
const systemSources = reactive<{ value: string[] }>({value: []})
const selectedSystemSources = ref<string>()

// 列表数据
const NewlyAddedData = reactive<{value: DataViewInfo[]}>({value: []})

// 列表显示数据
const tableData = reactive<{value: DataViewInfo[]}>({value: []})

// 分页参数
const paginationParam = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

/**
 * 获取数据来源下拉列表
 */
const getSystemSources = async () => {
  const {Jwt, url} = serveStore.getServeDetails('test')
  const res = await axios.get(`${url}/crm-mdm/v1/errorlog/errorlog/findCRMSystem`, {headers: {Jwt}})
  systemSources.value = res.data.result;
}

/**
 * 根据 系统 请求数据视图列表
 * @param dataView
 */
const getDataViewBySystemSource = async (dataView: string[]) => {
  dataViewStore.loading = true
  // 测试数据
  const getDataViewRequestForTest = dataView.map(async (item) => {
    return await dataViewStore.getDataView({
      systemOfConfigSource: item
    }, 'test')
  })
  const allTest = await Promise.allSettled(getDataViewRequestForTest)

  let dataAllTest: DataView[] = []
  allTest.forEach((item) => {
    if (item.status === "fulfilled" && item.value.data.data) {
      dataAllTest = [...dataAllTest, ...item.value.data.data.content]
    }
  })

  // 正式数据
  const getDataViewRequestForPro = dataView.map(async (item) => {
    return await dataViewStore.getDataView({
      systemOfConfigSource: item
    }, 'pro')
  })
  const allPro = await Promise.allSettled(getDataViewRequestForPro)
  let DataAllPro: DataView[] = []
  allPro.forEach((item) => {
    if (item.status === "fulfilled" && item.value.data.data) {
      DataAllPro = [...DataAllPro, ...item.value.data.data.content]
    }
  })
  await filterDataViewsAdded(dataAllTest, DataAllPro)
  dataViewStore.loading = false

}

/**
 * 过滤出 需要新增的列表
 * @param dataViewTestAll
 * @param dataViewProAll
 */
const filterDataViewsAdded = async (dataViewTestAll: any[], dataViewProAll: any[]) => {
  const dataViewProCode = dataViewProAll.map((item) => item.code)
  NewlyAddedData.value = dataViewTestAll.filter(item => !dataViewProCode.includes(item.code))
  paginationParam.total = NewlyAddedData.value.length
  handleSizeChange(paginationParam.pageSize)
}

/**
 * 切换每页显示数量
 * @param size
 */
const handleSizeChange = (size: number) => {
  paginationParam.pageSize = size
  tableData.value =  NewlyAddedData.value.slice(size * (paginationParam.currentPage - 1), size * paginationParam.currentPage)
}

/**
 * 切换页数
 */
const handleCurrentChange = (page: number) => {
  paginationParam.currentPage = page
  tableData.value =  NewlyAddedData.value.slice(paginationParam.pageSize * (page - 1), page * paginationParam.pageSize)
}

/**
 * 通过来源子系统过滤
 */
const filterBySystemSource = async () => {
  return  NewlyAddedData.value.filter(item => item.subSystem === selectedSystemSources.value)
}

/**
 * 勾选 需要更新的 数据
 * @param data 选中的数据
 */
const selectionChange = (data: DataViewInfo[]) => {
  dataViewStore.dataViewsUpdatable = [...data]
}

onMounted(async () => {
  await getSystemSources();
  await getDataViewBySystemSource( systemSources.value)
})

</script>

<template>
  <div class="left-content">
<!--    <div style="margin:20px 0 30px;text-align: left">-->
<!--      <el-select style="width: 300px" clearable v-model="selectedSystemSources" @change="" placeholder="请选择服务">-->
<!--        <el-option v-for="i in systemSources.value" :key="i" :label="i" :value="i"></el-option>-->
<!--      </el-select>-->
<!--      <el-button type="primary" style="margin-left: 20px">查询</el-button>-->
<!--    </div>-->
    <div style="margin: 0 0 10px;text-align: left">
      <el-button type="primary" @click="dataViewStore.beforeUpDateDataView(true)">同步</el-button>
    </div>
    <el-table
        :data="tableData.value"
        @selection-change="selectionChange"
        ref="testMenuRef"
        row-key="id"
        border
    >
      <el-table-column type="selection" width="55"/>
      <el-table-column prop="subSystem" label="来源子系统" width="220"/>
      <el-table-column prop="code" label="数据视图编码"/>
      <el-table-column prop="name" label="数据视图名称"/>
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