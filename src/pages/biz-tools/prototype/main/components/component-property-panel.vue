<template>
  <aside class="right-panel" :class="{ 'is-collapsed': isCollapsed }">
    <div class="panel-header">
      <span v-if="!isCollapsed">属性设置</span>
      <el-button
        text
        size="small"
        class="panel-collapse-btn"
        :icon="isCollapsed ? icons.Expand : icons.Fold"
        @click="toggleCollapsed"
      />
    </div>

    <el-scrollbar v-if="!isCollapsed" class="panel-body">
      <template v-if="component">
        <div class="config-section">
          <h3 class="section-title">基础信息</h3>
          <el-form label-position="right" label-width="72px" size="small">
            <div class="base-info-grid">
              <el-form-item label="名称">
                <el-input :model-value="pageFunctionName" disabled />
              </el-form-item>
              <el-form-item label="编码">
                <el-input :model-value="pageFunctionCode" disabled />
              </el-form-item>
            </div>
          </el-form>
        </div>

        <div v-if="component.type === 'table'" class="config-section">
          <h3 class="section-title">列表配置</h3>
          <el-form label-position="right" label-width="86px" size="small">
            <el-form-item label="选择模式">
              <el-radio-group v-model="tableConfig.selectionMode">
                <el-radio value="none">无</el-radio>
                <el-radio value="single">单选</el-radio>
                <el-radio value="multiple">多选</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>

          <div class="sub-toolbar">
            <span>列配置</span>
            <el-button text type="primary" @click="addTableColumn">新增列</el-button>
          </div>

          <div class="column-overview">
            <div class="column-overview-head column-overview-grid">
              <span>显示</span>
              <span>名称</span>
              <span>字段名</span>
              <span>查询</span>
              <span>搜索组件类型</span>
              <span>数据字典</span>
              <span>导出</span>
              <span>操作</span>
            </div>

            <div class="column-config-list">
              <div
                v-for="(col, index) in tableConfig.columns"
                :key="index"
                class="column-overview-row column-overview-grid"
                :class="{ 'is-active': selectedTableColumnIndex === index }"
                @click="selectTableColumn(index)"
              >
                <div class="switch-cell">
                  <el-switch v-model="col.visible" />
                </div>
                <el-input v-model="col.label" size="small" placeholder="名称" />
                <el-input v-model="col.prop" size="small" placeholder="字段名" />
                <div class="switch-cell">
                  <el-switch v-model="col.search" />
                </div>
                <el-select v-model="col.searchType" size="small" placeholder="类型">
                  <el-option
                    v-for="option in searchTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-input v-model="col.dictCode" size="small" placeholder="字典编码" />
                <div class="switch-cell">
                  <el-switch v-model="col.columnExport" />
                </div>
                <div class="action-cell">
                  <el-button link type="danger" @click.stop="removeTableColumn(index)">删除</el-button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedTableColumn" class="config-section detail-section">
            <div class="sub-toolbar">
              <span>完整属性</span>
              <span class="detail-tip">当前字段：{{ selectedTableColumn.label || `列 ${selectedTableColumnIndex + 1}` }}</span>
            </div>
            <div class="detail-tip detail-note">
              功能名称 / 功能编码继承当前页面，仅配置名称和编码。
            </div>

            <div class="column-detail-form">
              <div class="column-detail-grid">
                <div class="detail-field">
                  <span class="detail-label">名称</span>
                  <div class="detail-control"><el-input v-model="selectedTableColumn.label" placeholder="列名称" /></div>
                </div>
                <div class="detail-field">
                  <span class="detail-label">字段名</span>
                  <div class="detail-control"><el-input v-model="selectedTableColumn.prop" placeholder="字段名" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="component.type === 'button'" class="config-section">
          <h3 class="section-title">按钮配置</h3>
          <div class="sub-toolbar">
            <span>按钮列表</span>
            <el-button text type="primary" @click="addButton">新增按钮</el-button>
          </div>

          <div class="button-config-list">
            <div v-for="(btn, index) in buttonConfig.buttons" :key="index" class="button-config-card">
              <div class="button-card-head">
                <strong>{{ btn.buttonName || `按钮 ${index + 1}` }}</strong>
                <el-button link type="danger" @click="removeButton(index)">删除</el-button>
              </div>

              <el-form label-position="right" label-width="86px" size="small">
                <el-row :gutter="12">
                  <el-col :span="12">
                    <el-form-item label="按钮名称">
                      <el-input v-model="btn.buttonName" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="按钮编码">
                      <el-input v-model="btn.buttonCode" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="12">
                    <el-form-item label="按钮类型">
                      <el-input v-model="btn.buttonType" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="按钮顺序">
                      <el-input-number v-model="btn.buttonOrder" :min="1" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="12">
                    <el-form-item label="功能编码">
                      <el-input v-model="btn.functionCode" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="父级编码">
                      <el-input v-model="btn.parentCode" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="12">
                    <el-form-item label="按钮操作类型">
                      <el-input v-model="btn.buttonOperationType" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="图标名称">
                      <el-input v-model="btn.iconName" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="12">
                  <el-col :span="12">
                    <el-form-item label="请求地址">
                      <el-input v-model="btn.apiUrl" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="可见">
                      <el-switch v-model="btn.visible" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </div>
        </div>

        <div v-else-if="component.type === 'custom-header'" class="config-section">
          <h3 class="section-title">表头配置</h3>
          <el-form label-position="right" label-width="86px" size="small">
            <el-form-item label="标题">
              <el-input v-model="headerConfig.title" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="headerConfig.description" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>

          <div class="sub-toolbar">
            <span>统计项</span>
            <el-button text type="primary" @click="addHeaderStat">新增统计</el-button>
          </div>

          <div class="stat-config-list">
            <div v-for="(stat, index) in headerConfig.stats" :key="index" class="stat-config-row">
              <el-input v-model="stat.label" placeholder="标签" size="small" />
              <el-input v-model="stat.value" placeholder="数值" size="small" />
              <el-input v-model="stat.tone" placeholder="样式" size="small" />
              <el-button size="small" type="danger" text @click="removeHeaderStat(index)">删除</el-button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <p>请选择一个组件开始编辑</p>
      </div>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import {
  createDefaultButtonConfig,
  createDefaultHeaderConfig,
  createDefaultTableColumnConfig,
  createDefaultTableConfig,
} from '../component-presets'
import type {
  ButtonComponentConfig,
  CanvasComponent,
  HeaderComponentConfig,
  TableColumnConfig,
  TableComponentConfig
} from '../component-types'
import type { PageConfig } from '@pages/biz-tools/types'

// 属性面板接收当前组件、页面基础信息和折叠状态。
const props = defineProps<{
  component: CanvasComponent | null
  tableColumnIndex?: number
  pageConfig?: PageConfig | null
  collapsed?: boolean
}>()

// 属性面板向父级同步列选择和面板折叠状态。
const emit = defineEmits<{
  (event: 'update:tableColumnIndex', index: number): void
  (event: 'update:collapsed', collapsed: boolean): void
}>()

// 当前正在编辑的画布组件。
const component = computed(() => props.component)
// 右侧属性面板是否处于折叠状态。
const isCollapsed = computed(() => props.collapsed === true)
// 当前列表面板选中的列下标。
const selectedTableColumnIndex = ref(props.tableColumnIndex ?? 0)
// 从页面配置继承展示用的功能名称。
const pageFunctionName = computed(() => props.pageConfig?.functionName || '')
// 从页面配置继承展示用的功能编码。
const pageFunctionCode = computed(() => props.pageConfig?.functionCode || '')

// 属性面板自身使用的折叠和展开图标。
const icons = {
  Fold: ElementPlusIconsVue.Fold,
  Expand: ElementPlusIconsVue.Expand
}

// 读取列表组件配置；当前组件不是列表时返回默认配置。
const tableConfig = computed<TableComponentConfig>(() => component.value?.type === 'table'
  ? component.value.config as TableComponentConfig
  : createDefaultTableConfig())

// 读取按钮组件配置；当前组件不是按钮时返回默认配置。
const buttonConfig = computed<ButtonComponentConfig>(() => component.value?.type === 'button'
  ? component.value.config as ButtonComponentConfig
  : createDefaultButtonConfig())

// 读取自定义表头配置；当前组件不是表头时返回默认配置。
const headerConfig = computed<HeaderComponentConfig>(() => component.value?.type === 'custom-header'
  ? component.value.config as HeaderComponentConfig
  : createDefaultHeaderConfig())

// 列表列的搜索组件类型先收口一份常用选项，后面接真实组件库时再替换。
const searchTypeOptions = [
  { label: '输入框', value: 'input' },
  { label: '下拉框', value: 'select' },
  { label: '日期', value: 'date' },
  { label: '日期范围', value: 'daterange' },
  { label: '文本域', value: 'textarea' }
]

// 根据下标取得当前列表列详情。
const selectedTableColumn = computed<TableColumnConfig | null>(() => {
  return tableConfig.value.columns[selectedTableColumnIndex.value] || null
})

// 组件切换或列数量变化后，修正当前选中的列下标，避免右侧详情指向失效数据。
watch(
  () => [component.value?.id || component.value?.componentId || '', component.value?.type, tableConfig.value.columns.length],
  () => {
    if (component.value?.type !== 'table') {
      selectedTableColumnIndex.value = 0
      return
    }

    if (!tableConfig.value.columns.length) {
      selectedTableColumnIndex.value = 0
      return
    }

    if (selectedTableColumnIndex.value >= tableConfig.value.columns.length) {
      selectedTableColumnIndex.value = tableConfig.value.columns.length - 1
    }
  },
  { immediate: true }
)

// 画布表头点击后，从父组件同步当前列下标。
watch(() => props.tableColumnIndex, index => {
  if (typeof index === 'number') {
    selectedTableColumnIndex.value = index
  }
})

// 选中列表中的一列，并同步父级选中状态。
const selectTableColumn = (index: number) => {
  selectedTableColumnIndex.value = index
  emit('update:tableColumnIndex', index)
}

// 切换右侧属性面板的折叠状态。
const toggleCollapsed = () => {
  emit('update:collapsed', !isCollapsed.value)
}

// 在列表末尾新增一列并选中它。
const addTableColumn = () => {
  tableConfig.value.columns.push(createDefaultTableColumnConfig(tableConfig.value.columns.length + 1))
  selectedTableColumnIndex.value = tableConfig.value.columns.length - 1
}

// 删除指定列表列并修正选中下标。
const removeTableColumn = (index: number) => {
  tableConfig.value.columns.splice(index, 1)

  if (!tableConfig.value.columns.length) {
    selectedTableColumnIndex.value = 0
    return
  }

  if (selectedTableColumnIndex.value >= tableConfig.value.columns.length) {
    selectedTableColumnIndex.value = tableConfig.value.columns.length - 1
  }
}

// 新增一个带系统字段结构的默认按钮。
const addButton = () => {
  buttonConfig.value.buttons.push({
    assignFunctionCode: '',
    buttonCode: `button_${buttonConfig.value.buttons.length + 1}`,
    buttonName: `按钮${buttonConfig.value.buttons.length + 1}`,
    buttonOrder: buttonConfig.value.buttons.length + 1,
    buttonType: 'default',
    name: `按钮${buttonConfig.value.buttons.length + 1}`,
    parentCode: '',
    type: 'button',
    visible: true,
    buttonMethod: 'click',
    buttonOperationType: '',
    buttonTypeName: '',
    apiUrl: '',
    ask: '',
    configCode: '',
    doCode: '',
    functionCode: '',
    iconCode: '',
    iconEffect: '',
    iconName: '',
    iconStyle: '',
    iconUrl: '',
    queryUrl: ''
  })
}

// 删除指定按钮配置。
const removeButton = (index: number) => {
  buttonConfig.value.buttons.splice(index, 1)
}

// 新增一个自定义表头统计项。
const addHeaderStat = () => {
  headerConfig.value.stats.push({
    label: `统计${headerConfig.value.stats.length + 1}`,
    value: '0'
  })
}

// 删除指定自定义表头统计项。
const removeHeaderStat = (index: number) => {
  headerConfig.value.stats.splice(index, 1)
}
</script>

<style scoped>
.right-panel {
  flex: 0 0 720px;
  width: 720px;
  min-width: 720px;
  background-color: #fff;
  min-height: 0;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.right-panel.is-collapsed {
  flex-basis: 48px;
  width: 48px;
  min-width: 48px;
}

.panel-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 20px;
  font-weight: bold;
  border-bottom: 1px solid #e4e7ed;
}

.right-panel.is-collapsed .panel-header {
  justify-content: center;
  padding: 0;
}

.panel-body {
  padding: 20px;
}

.panel-collapse-btn {
  flex-shrink: 0;
  padding: 0;
}

.config-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
  font-weight: normal;
}

.base-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.base-info-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.base-info-grid :deep(.el-form-item__content) {
  min-width: 0;
}

.sub-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #5f6b7a;
  font-size: 13px;
}

.column-config-list,
.button-config-list,
.stat-config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-config-row {
  display: grid;
  grid-template-columns: 1fr 1fr 100px auto;
  gap: 8px;
  align-items: center;
}

.column-config-card {
  padding: 12px;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  background: #fafbfd;
}

.column-overview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-overview-grid {
  display: grid;
  grid-template-columns: 48px 96px 96px 48px 122px 96px 48px 56px;
  gap: 8px;
  align-items: center;
}

.column-overview-head {
  padding: 0 8px;
  color: #7b8698;
  font-size: 12px;
  line-height: 1.2;
}

.column-overview-row {
  padding: 10px 8px;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  background: #fafbfd;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.column-overview-row.is-active {
  border-color: #1677ff;
  background: #f4f9ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.08);
}

.switch-cell,
.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-section {
  margin-top: 18px;
}

.detail-tip {
  color: #8a94a6;
  font-size: 12px;
}

.column-detail-form {
  margin-top: 4px;
}

.column-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px 16px;
}

.detail-field {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  align-items: center;
}

.detail-label {
  color: #5f6b7a;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  text-align: right;
}

.detail-control {
  min-width: 0;
}

.detail-note {
  margin-top: -4px;
  margin-bottom: 12px;
}

.full-width-input {
  width: 100%;
}

.button-config-card {
  padding: 12px;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  background: #fafbfd;
}

.button-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.empty-state {
  padding: 24px 0;
  text-align: center;
  color: #8a94a6;
}
</style>
