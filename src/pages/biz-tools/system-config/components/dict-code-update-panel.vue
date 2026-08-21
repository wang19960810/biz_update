<script setup lang="ts">
const emit = defineEmits<{
  (e: 'render-ready'): void
}>()
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { instance } from "@src/server/index.ts";
import { useDictCodeStore, useTransferMenuGlobalStore } from "@src/store/transfer-menu";
import { useServeStore } from "@src/store/serveStoreState.ts";
import type { DictCode } from "../../types/index.d.ts";

type DictCodeTableRow = DictCode & {
  syncKey: string
}

const serveStore = useServeStore()
const dictCodeStore = useDictCodeStore()
const transferMenuGlobalStore = useTransferMenuGlobalStore()

const systemSources = ref<Array<{dictCode: string, dictValue: string}>>([])
const selectedSystems = ref<string[]>([])
const keyword = ref('')
const queryMode = 'updatable' // 固定为更新模式

const tableData = ref<DictCodeTableRow[]>([])
const selectedRows = ref<DictCodeTableRow[]>([])
const dictCodeTableRef = ref<any>(null)

const systemSourceLoading = ref(false)
const tableLoading = ref(false)
const tableReady = ref(false)
const showTableSkeleton = computed(() => tableLoading.value || !tableReady.value)

const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

let tableRenderTimer: number | null = null
let requestVersion = 0

const normalizeKeyword = (value: string) => value.trim().toLowerCase()

const queriedCount = computed(() => tableData.value.length)
const effectiveQuerySystems = computed(() => selectedSystems.value)

const filteredTableData = computed(() => {
  const normalizedKeyword = normalizeKeyword(keyword.value)

  if (!normalizedKeyword) {
    return tableData.value
  }

  return tableData.value.filter(item => {
    return [item.dictTypeModuleName, item.dictTypeCode, item.dictTypeName]
      .filter(Boolean)
      .some(field => (field as string).toLowerCase().includes(normalizedKeyword))
  })
})

const pagedTableData = computed(() => {
  const start = pagination.pageSize * (pagination.currentPage - 1)
  const end = start + pagination.pageSize

  return filteredTableData.value.slice(start, end)
})

const clearSelectionState = () => {
  selectedRows.value = []
  dictCodeStore.dictCodesUpdatable = []
  dictCodeTableRef.value?.clearSelection?.()
}

const resetQueryResult = () => {
  tableData.value = []
  pagination.currentPage = 1
  clearSelectionState()
}

const warmUpTable = () => {
  if (tableReady.value || tableRenderTimer) {
    return
  }

  tableRenderTimer = window.setTimeout(() => {
    tableReady.value = true
    tableRenderTimer = null
  }, 0)
}

const buildSyncKey = (item: Pick<DictCode, 'dictTypeModule' | 'dictTypeCode'>) => `${item.dictTypeModule}::${item.dictTypeCode}`

const setSelectionToStore = (rows: DictCodeTableRow[]) => {
  dictCodeStore.dictCodesUpdatable = rows.map(item => item.dictTypeCode)
}

const loadSystemSources = async () => {
  if (systemSourceLoading.value) {
    return
  }

  systemSourceLoading.value = true

  try {
    const { Jwt, url } = serveStore.getServeDetails('test')
    const res = await instance.get(`${url}/crm-mdm/v1/dictionary/dictdata/findContainExtendByConditions?dictTypeCode=module_group&pageSize=50`, {
      headers: { Jwt }
    })

    systemSources.value = res.data.result || []
  } finally {
    systemSourceLoading.value = false
  }
}

const buildTableRows = (dictCodes: DictCode[]) => {
  return dictCodes.map<DictCodeTableRow>(item => {
    return {
      ...item,
      syncKey: buildSyncKey(item)
    }
  })
}

const queryDictCodes = async () => {
  const currentRequestVersion = ++requestVersion
  tableLoading.value = true
  resetQueryResult()

  try {
    // 不传系统来源参数，查询所有数据
    await dictCodeStore.getDictCodeTypeAll({
      dictTypeModule: ''
    })

    if (currentRequestVersion !== requestVersion) {
      return
    }

    // 固定使用 dictCodeOfTest（可更新的数据）
    const sourceData = dictCodeStore.dictCodeOfTest

    tableData.value = buildTableRows(sourceData)
    pagination.currentPage = 1
  } finally {
    if (currentRequestVersion === requestVersion) {
      tableLoading.value = false
    }
  }
}

const handleSelectionChange = (rows: DictCodeTableRow[]) => {
  selectedRows.value = JSON.parse(JSON.stringify(rows))
  setSelectionToStore(rows)
}

const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
}

const handleCurrentPageChange = (page: number) => {
  pagination.currentPage = page
}

const handleSystemSourceClear = () => {
  requestVersion++
  tableLoading.value = false
  resetQueryResult()
}

const handleKeywordClear = () => {
  pagination.currentPage = 1
}

const syncSelectedDictCodes = async () => {
  if (!selectedRows.value.length) {
    ElMessage.info('请选择需要同步的数据字典')
    return
  }

  setSelectionToStore(selectedRows.value)
  
  const operationType = queryMode.value === 'newly-added' ? 'add' : 'update'
  await dictCodeStore.beforeUpdateDictCodes(operationType)
  
  ElMessage.success('数据字典同步完成')
  await queryDictCodes()
}

watch(filteredTableData, () => {
  pagination.currentPage = 1
}, {
  flush: 'sync'
})

watch(selectedSystems, () => {
  clearSelectionState()
}, {
  deep: true
})

onMounted(async () => {
  emit('render-ready')
  warmUpTable()
  await loadSystemSources()
  
  // 直接查询所有可更新字典（不需要选择系统）
  await queryDictCodes()
})

onActivated(async () => {
  warmUpTable()

  if (!systemSources.value.length) {
    await loadSystemSources()
  }

  if (!tableData.value.length && selectedSystems.value.length) {
    await queryDictCodes()
  }
})

onDeactivated(() => {
  requestVersion++
  clearSelectionState()
})

onBeforeUnmount(() => {
  if (tableRenderTimer) {
    window.clearTimeout(tableRenderTimer)
    tableRenderTimer = null
  }
})
</script>

<template>
  <section class="workspace-card">
    <div class="workspace-header">
      <div>
        <p class="workspace-kicker">Update Dictionary</p>
        <h2>更新字典</h2>
      </div>
      <p class="workspace-tip">
        列表可查询测试环境数据字典，勾选后同步到正式环境；执行同步时再判断正式环境是更新还是新增。
      </p>
    </div>

    <div class="workspace-body" v-loading="transferMenuGlobalStore.loading">
      <div class="workspace-panel">
        <div class="query-toolbar">
          <div class="query-fields">
            <div class="field-item">
              <label class="field-label">系统来源</label>
              <el-select
                v-model="selectedSystems"
                class="field-control"
                multiple
                clearable
                collapse-tags
                collapse-tags-tooltip
                :loading="systemSourceLoading"
                placeholder="请选择系统来源"
                @clear="handleSystemSourceClear"
              >
                <el-option
                  v-for="item in systemSources"
                  :key="item.dictCode"
                  :label="item.dictValue"
                  :value="item.dictCode"
                />
              </el-select>
            </div>

            <div class="field-item">
              <label class="field-label">关键字筛选</label>
              <el-input
                v-model="keyword"
                class="field-control"
                placeholder="请输入模块、编码或名称"
                clearable
                @clear="handleKeywordClear"
              />
            </div>
          </div>

          <div class="query-actions">
            <el-button type="primary" :loading="tableLoading" @click="queryDictCodes">查询可更新字典</el-button>
            <el-button @click="selectedSystems = systemSources.map(s => s.dictCode)">全选系统</el-button>
          </div>
        </div>

        <div class="table-toolbar">
          <el-button type="primary" :disabled="!selectedRows.length" @click="syncSelectedDictCodes">
            更新选中数据字典
          </el-button>
          <div class="toolbar-stats">
            <span class="stat-item">当前结果: <strong>{{ filteredTableData.length }}</strong> 条</span>
            <span class="stat-divider">|</span>
            <span class="stat-item">总计: <strong>{{ queriedCount }}</strong> 条</span>
            <span class="stat-divider">|</span>
            <span class="stat-item">已勾选: <strong>{{ selectedRows.length }}</strong> 条</span>
          </div>
        </div>

        <div v-if="showTableSkeleton" class="table-skeleton" aria-hidden="true">
          <div v-for="item in 7" :key="`dict-code-skeleton-${item}`" class="skeleton-row">
            <div class="skeleton-block skeleton-cell checkbox"></div>
            <div class="skeleton-block skeleton-cell medium"></div>
            <div class="skeleton-block skeleton-cell long"></div>
            <div class="skeleton-block skeleton-cell long"></div>
            <div class="skeleton-block skeleton-cell short"></div>
          </div>
        </div>

        <template v-else>
          <el-table
            ref="dictCodeTableRef"
            :data="pagedTableData"
            row-key="syncKey"
            :empty-text="effectiveQuerySystems.length ? '暂无数据字典' : '暂无可查询系统'"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" :reserve-selection="true" />
            <el-table-column prop="dictTypeModuleName" label="所属模块" min-width="150" />
            <el-table-column prop="dictTypeCode" label="类型编码" min-width="200" />
            <el-table-column prop="dictTypeName" label="类型名称" min-width="220" />
            <el-table-column prop="modifyTime" label="修改时间" min-width="180" />
          </el-table>

          <div class="table-footer">
            <p class="selection-hint">
              已选 <strong>{{ selectedRows.length }}</strong> 项
            </p>

            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 30, 40]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredTableData.length"
              @size-change="handlePageSizeChange"
              @current-change="handleCurrentPageChange"
            />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.workspace-card {
  min-height: 620px;
  padding: 22px 24px 24px;
  display: flex;
  flex-direction: column;
  overflow: visible;
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(247, 250, 252, 0.78));
  box-shadow: 0 20px 56px rgba(24, 39, 69, 0.08);
  backdrop-filter: blur(12px);
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-shrink: 0;
  min-width: 0;
}

.workspace-kicker {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.24em;
  color: #0f766e;
  text-transform: uppercase;
  white-space: nowrap;
}

.workspace-header h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
  color: #172033;
}

.workspace-tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #5d697f;
  text-align: right;
  white-space: normal;
  flex-shrink: 0;
}

.workspace-body {
  flex: 1;
  min-height: 0;
}

.workspace-panel {
  width: 100%;
  min-height: 0;
  padding: 60px 22px 22px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border: 1px solid rgba(25, 43, 75, 0.12);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 250, 252, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  position: relative;
  overflow: hidden;
}

.workspace-panel::before {
  position: absolute;
  top: 16px;
  left: 18px;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  content: "TEST DICT CODE";
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
}

.query-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.query-fields {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.field-label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #344054;
  white-space: nowrap;
}

.field-control {
  width: 200px;
}

.field-item:first-child .field-control {
  width: 240px;
}

.query-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.field-control :deep(.el-input__wrapper),
.field-control :deep(.el-select__wrapper) {
  min-height: 38px;
  border-radius: 8px;
  background: rgba(246, 248, 251, 0.92);
  box-shadow: inset 0 0 0 1px rgba(27, 43, 73, 0.08);
}

.field-control :deep(.is-focused.el-select__wrapper),
.field-control :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    inset 0 0 0 1px rgba(217, 119, 6, 0.45),
    0 0 0 4px rgba(217, 119, 6, 0.08);
}

.query-actions :deep(.el-button),
.table-toolbar :deep(.el-button) {
  margin-right: 0;
  min-height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.query-actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
}

.table-toolbar :deep(.el-button--primary) {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
}

.query-actions :deep(.el-button + .el-button) {
  background: #fff;
  color: #344054;
  border: 1px solid #d0d5dd;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}

.query-actions :deep(.el-button + .el-button:hover) {
  background: #f9fafb;
  border-color: #d0d5dd;
}

.table-toolbar {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #5d697f;
}

.stat-item strong {
  color: #172033;
  font-size: 14px;
  font-weight: 600;
}

.stat-divider {
  color: #d0d5dd;
}

.workspace-panel :deep(.el-table) {
  flex: 1;
  width: 100%;
  min-height: 0;
  min-width: 0;
  height: auto !important;
  border: 1px solid rgba(28, 44, 75, 0.08);
  border-radius: 16px;
  overflow: auto;
  --el-table-header-bg-color: rgba(243, 246, 251, 0.96);
  --el-table-row-hover-bg-color: rgba(245, 158, 11, 0.08);
  --el-table-border-color: rgba(28, 44, 75, 0.08);
  --el-table-header-text-color: #5c6475;
  --el-table-text-color: #1f2937;
  --el-fill-color-blank: transparent;
}

.workspace-panel :deep(.el-table th) {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.workspace-panel :deep(.el-table td) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.workspace-panel :deep(.el-table__empty-text) {
  color: #8a94a6;
  font-size: 15px;
}

.table-skeleton {
  flex: 1;
  min-height: 320px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(28, 44, 75, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(241, 245, 249, 0.78));
}

.skeleton-row {
  display: grid;
  grid-template-columns: 30px 1fr 1.2fr 1.2fr 120px;
  align-items: center;
  gap: 14px;
}

.skeleton-block {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #e8edf4;
}

.skeleton-block::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.74), transparent);
  animation: skeleton-shimmer 1.1s ease-in-out infinite;
}

.skeleton-cell {
  height: 16px;
}

.skeleton-cell.checkbox {
  width: 18px;
  height: 18px;
  border-radius: 6px;
}

.skeleton-cell.short {
  width: 72px;
}

.skeleton-cell.medium {
  width: 68%;
}

.skeleton-cell.long {
  width: 84%;
}

.table-footer {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 32px;
}

.selection-hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #5d697f;
  flex-shrink: 0;
}

.selection-hint strong {
  color: #172033;
  font-weight: 600;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1200px) {
  .query-fields {
    flex-direction: column;
    align-items: stretch;
  }

  .field-item {
    flex-direction: row;
    justify-content: space-between;
  }

  .field-control,
  .field-item:first-child .field-control {
    width: auto;
    flex: 1;
    min-width: 200px;
  }

  .workspace-tip {
    text-align: left;
  }
}

@media (max-width: 960px) {
  .workspace-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-footer,
  .table-toolbar {
    align-items: flex-start;
  }

  .toolbar-stats {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .workspace-card {
    min-height: auto;
    padding: 18px;
    border-radius: 20px;
  }

  .workspace-header h2 {
    font-size: 24px;
  }

  .workspace-panel {
    padding: 56px 14px 14px;
    border-radius: 20px;
  }

  .query-actions :deep(.el-button),
.table-toolbar :deep(.el-button) {
  margin-right: 0;
  min-height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.query-actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
}

.table-toolbar :deep(.el-button--primary) {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
}

  .field-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .field-label {
    margin-bottom: 6px;
  }

  .field-control,
  .field-item:first-child .field-control {
    width: 100%;
  }

  .skeleton-row {
    grid-template-columns: 1fr;
  }

  .skeleton-cell.short,
  .skeleton-cell.medium,
  .skeleton-cell.long {
    width: 100%;
  }
}
</style>
