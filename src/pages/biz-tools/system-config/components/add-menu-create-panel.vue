<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

import { useMenuStore } from "@src/store/transfer-menu";
import { useServeStore } from '@src/store/serveStoreState.ts'
import { parentFirstSort } from "@src/units/tool.ts"

import type { MenuItem } from "../../types";

const emit = defineEmits<{
  (event: 'render-ready'): void
}>()

const menuStore = useMenuStore()
const serveStore = useServeStore()
const loading = ref(false)

/**
 * 当前选中的待新增菜单。
 */
const selectMenu = reactive<{ value: MenuItem[] }>({
  value: []
})

onMounted(async () => {
  await updateList()
})

/**
 * 拉取测试环境中可新增的菜单列表。
 */
const updateList = async () => {
  loading.value = true
  await menuStore.getUpdatedMenuList()
  loading.value = false
  emit('render-ready')
}

/**
 * 勾选需要同步到正式环境的菜单。
 */
const selectionChange = (data: MenuItem[]) => {
  selectMenu.value = [...data]
}

/**
 * 将菜单对象整理成新增接口需要的参数结构。
 */
const beforeMenuSubmit = (data: MenuItem) => {
  const { code, comment, sortIndex, resource, parentCode, icon } = data

  return {
    addProgress: null,
    code,
    comment,
    resource,
    sortIndex,
    parentCode,
    icon,
    functionLevel: "1",
    type: "default",
    viewItem: 1,
    tstatus: 0
  }
}

/**
 * 记录本地同步历史，便于后续追溯当天操作。
 */
const setHistory = (data: MenuItem[]) => {
  const fromData = data.map(item => ({ ...item }))
  const historyMenu = localStorage.getItem("historyMenu")
  const historyMenuJson: { [key: string]: MenuItem[] } = historyMenu ? JSON.parse(historyMenu) : {}

  const currentDate = new Date()
  const date = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
  const dateStr = new Date(date).getTime().toString()

  if (historyMenuJson[dateStr]) {
    historyMenuJson[dateStr] = [...fromData, ...historyMenuJson[dateStr]]
  } else {
    historyMenuJson[dateStr] = fromData
  }

  localStorage.setItem("historyMenu", JSON.stringify(historyMenuJson))
}

/**
 * 将选中的新增菜单同步到正式环境。
 */
const addMenuSubmit = () => {
  const promiseArr: any[] = []
  const { url: prodUrl, Jwt: prodJwt } = serveStore.getServeDetails('prod')
  const selectMenuSort = parentFirstSort(selectMenu.value)

  selectMenuSort.forEach((item: MenuItem) => {
    const params = beforeMenuSubmit(item)
    promiseArr.push(axios.post(prodUrl + "/crm-mdm/v1/competences/competences", params, {
      headers: {
        Jwt: prodJwt
      }
    }))
  })

  loading.value = true
  Promise.allSettled(promiseArr).then((results) => {
    const successArr: MenuItem[] = []

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        successArr.push(result.value.data.data)
      } else {
        console.log('失败:', result.reason)
      }
    })

    selectMenu.value = []
    setHistory(successArr)
    updateList()
    ElMessage.success('菜单同步完成！')
  })
}
</script>

<template>
  <section class="panel-card" v-loading="loading">
    <div class="panel-header">
      <div>
        <p class="panel-kicker">Add Menu</p>
        <h2>新增菜单</h2>
      </div>
      <p class="panel-tip">
        展示测试环境新增的菜单数据，确认后可批量同步到正式环境。
      </p>
    </div>

    <div class="panel-toolbar">
      <el-button type="primary" @click="addMenuSubmit">同步选中菜单</el-button>
    </div>

    <div class="panel-table">
      <el-table
        :data="menuStore.addedDataMenuList"
        :tree-props="{ checkStrictly: true }"
        row-key="id"
        @selection-change="selectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="comment" label="菜单名称" />
        <el-table-column prop="code" label="菜单编码" />
        <el-table-column prop="modifyTime" label="修改时间" />
      </el-table>
    </div>
  </section>
</template>

<style scoped lang="less">
.panel-card {
  min-height: 520px;
  padding: 20px 22px 22px;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #0f766e;
  text-transform: uppercase;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  color: #172033;
}

.panel-tip {
  max-width: 520px;
  margin: 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
  text-align: right;
}

.panel-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.panel-toolbar .el-button {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.panel-table :deep(.el-table) {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: rgba(14, 165, 233, 0.06);
  --el-table-border-color: #e5e7eb;
  --el-table-header-text-color: #475467;
  --el-table-text-color: #1f2937;
}

.panel-table :deep(.el-table th) {
  font-size: 12px;
  font-weight: 700;
}

.panel-table :deep(.el-table td) {
  padding-top: 10px;
  padding-bottom: 10px;
}

@media (max-width: 960px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-tip {
    max-width: none;
    text-align: left;
  }

  .panel-toolbar {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .panel-card {
    min-height: auto;
    padding: 16px;
  }
}
</style>
