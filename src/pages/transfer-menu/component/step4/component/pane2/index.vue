<script setup lang="ts">
import {reactive, onMounted} from "vue";
import { ElMessage } from "element-plus"
import {useDictCodeStore} from "@src/store/transfer-menu";
import {useTransferMenuGlobalStore} from "@src/store/index";
import { timeSort } from "@src/units/tool.ts"
import type { DictCode} from "../../../../types/index"

const dictCodeStore = useDictCodeStore();
const transferMenuGlobalStore = useTransferMenuGlobalStore();

// 列表数据
const updatedData = reactive<{value: DictCode[]}>({value: []})

// 列表显示数据
const tableData = reactive<{value: DictCode[]}>({value: []})

const filterParams = reactive< { dictTypeCode: string, dictTypeModule: string }>({
  dictTypeCode: "",
  dictTypeModule: "",
})

// 分页参数
const paginationParam = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

/**
 * 切换每页显示数量
 * @param size
 */
const handleSizeChange = (size: number) => {
  paginationParam.pageSize = size
  tableData.value = updatedData.value.slice(size * (paginationParam.currentPage - 1), size * paginationParam.currentPage)
  paginationParam.total = updatedData.value.length
}

/**
 * 切换页数
 */
const handleCurrentChange = (page: number) => {
  paginationParam.currentPage = page
  tableData.value = updatedData.value.slice(paginationParam.pageSize * (page - 1), page * paginationParam.pageSize)
  paginationParam.total = updatedData.value.length
}

/**
 * 勾选 需要更新的 数据
 * @param data 选中的数据
 */
const selectionChange = (data: DictCode[]) => {
  dictCodeStore.dictCodesUpdatable = data.map((item) => item.dictTypeCode)
}

/**
 * 初始化数据并排序
 * @param data
 */
const initValue = (data: DictCode[]) => {
  updatedData.value = timeSort(data, 'modifyTime')
  paginationParam.currentPage = 1
  handleSizeChange(paginationParam.pageSize)
}

/**
 * 更新数据字典到正式环境
 */
const updateDictCode = () =>{
  if(!dictCodeStore.dictCodesUpdatable.length) {
    ElMessage.info("请选择需要同步到正式环境的数据字典！")
    return
  }
  dictCodeStore.beforeUpdateDictCodes('update')
}

/**
 * 过滤查询条件
 */
const filterListData = () => {
  let filterData = dictCodeStore.dictCodeOfTest
  if(filterParams.dictTypeModule) {
    filterData = filterData.filter((item: DictCode) => item.dictTypeModule === filterParams.dictTypeModule )
  }

  if(filterParams.dictTypeCode) { // 通过数据字典过滤
    filterData = filterData.filter((item: DictCode) => item.dictTypeCode.indexOf(filterParams.dictTypeCode) !== -1 )
  }
  initValue(filterData)
}

onMounted(async () => {
  dictCodeStore.dictCodesUpdatable = []
  transferMenuGlobalStore.loading = true
  try{
    !dictCodeStore.dictCodeOfTest.length && await dictCodeStore.getDictCodeTypeAll()
    initValue(dictCodeStore.dictCodeOfTest)
  } finally {
    transferMenuGlobalStore.loading = false
  }
})

</script>

<template>
  <div class="left-content" v-loading=" transferMenuGlobalStore.loading">
    <div style="margin:20px 0 30px;text-align: left">
      <div style="margin:20px 0 30px;text-align: left">
        <el-select style="width: 300px;margin-right: 10px" clearable v-model="filterParams.dictTypeModule" placeholder="请选择系统来源">
          <el-option v-for="i in dictCodeStore.systemSource" :key="i" :label="i.dictValue" :value="i.dictCode"></el-option>
        </el-select>
        <el-input v-model="filterParams.dictTypeCode"  @keyup.enter="filterListData" placeholder="请输入字典编码" clearable style="width: 300px;"></el-input>
        <el-button type="primary" style="margin-left: 20px"  @click="filterListData">查询</el-button>
      </div>
    </div>
    <div style="margin: 0 0 10px;text-align: left">
      <el-button type="primary" @click="updateDictCode">更新</el-button>
    </div>
    <el-table
        :data="tableData.value"
        @selection-change="selectionChange"
        ref="testMenuRef"
        row-key="id"
        border
    >
      <el-table-column type="selection" width="55"/>
      <el-table-column prop="dictTypeModuleName" label="所属模块"/>
      <el-table-column prop="dictTypeCode" label="类型编码"/>
      <el-table-column prop="dictTypeName" label="类型名称"/>
      <el-table-column prop="modifyTime" label="修改时间"/>
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