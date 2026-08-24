<template>
  <section class="component-palette">
    <div class="palette-header">
      <span class="palette-title">组件</span>
    </div>

    <el-scrollbar class="palette-body">
      <div class="component-list">
        <div
          v-for="comp in components"
          :key="comp.type"
          class="component-item"
          draggable="true"
          @dragstart="handleDragStart($event, comp)"
        >
          <el-icon class="component-icon">
            <component :is="comp.icon" />
          </el-icon>
          <span class="component-name">{{ comp.label }}</span>
        </div>
      </div>
    </el-scrollbar>

    <el-dialog
      v-model="tableConfigVisible"
      title="配置列表组件"
      width="600px"
      @close="resetTableConfig"
    >
      <el-form ref="tableFormRef" :model="tableConfig" label-width="100px" size="small">
        <el-form-item label="列数量" required>
          <el-input-number
            v-model="tableConfig.columnCount"
            :min="1"
            :max="20"
            controls-position="right"
            class="column-count-input"
          />
        </el-form-item>

        <el-form-item label="选择模式" required>
          <el-radio-group v-model="tableConfig.selectionMode">
            <el-radio value="none">无</el-radio>
            <el-radio value="single">单选</el-radio>
            <el-radio value="multiple">多选</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="列配置" required>
          <span class="config-tip">请填写每一列的名称和字段名</span>
        </el-form-item>

        <div class="column-config-list">
          <div v-for="(col, index) in tableConfig.columns" :key="index" class="column-config-row">
            <el-input
              v-model="col.label"
              placeholder="列名称"
              size="small"
              style="width: 140px; margin-right: 8px"
            />
            <el-input
              v-model="col.prop"
              placeholder="字段名"
              size="small"
              style="width: 140px; margin-right: 8px"
            />
            <el-input-number
              v-model="col.width"
              placeholder="宽度"
              size="small"
              :min="60"
              style="width: 100px; margin-right: 8px"
            />
            <el-button
              size="small"
              type="danger"
              text
              @click="removeColumn(index)"
            >
              删除
            </el-button>
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="tableConfigVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTableConfig">确定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Grid } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type {
  ComponentCreatePayload,
  TableComponentConfig
} from '../component-types'

type BuilderType = 'list' | 'form'

interface PaletteComponent {
  type: string
  label: string
  icon: typeof Grid
  availableFor: BuilderType[]
}

// 所有组件统一维护在一个数据源中；availableFor 用于区分列表和表单可用范围。
const components: PaletteComponent[] = [
  {
    type: 'table',
    label: '列表',
    icon: Grid,
    availableFor: ['list']
  }
]

const emit = defineEmits<{
  (event: 'create', payload: ComponentCreatePayload): void
}>()

// 将组件类型写入拖拽数据，供中央画布识别要创建的组件。
const handleDragStart = (event: DragEvent, comp: PaletteComponent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('component-type', comp.type)
    event.dataTransfer.setData('application/x-page-builder-component', comp.type)
  }
}

const tableConfigVisible = ref(false)
const tableFormRef = ref<any>(null)

const tableConfig = reactive<TableComponentConfig & { columnCount: number }>({
  columnCount: 3,
  selectionMode: 'none',
  columns: []
})

// 根据列数量补齐或裁剪列定义，保留用户已经填写的内容。
const syncColumnCount = (count: number) => {
  while (tableConfig.columns.length < count) {
    tableConfig.columns.push({
      label: `列${tableConfig.columns.length + 1}`,
      prop: `field${tableConfig.columns.length + 1}`,
      width: undefined
    })
  }

  if (tableConfig.columns.length > count) {
    tableConfig.columns.splice(count)
  }
}

watch(() => tableConfig.columnCount, count => {
  syncColumnCount(Number(count) || 1)
})

// 删除指定下标的列表列定义。
const removeColumn = (index: number) => {
  tableConfig.columns.splice(index, 1)
}

// 清空列表配置，保证下一次拖拽从全新的配置开始。
const resetTableConfig = () => {
  tableConfig.columnCount = 3
  tableConfig.selectionMode = 'none'
  tableConfig.columns = []
  syncColumnCount(tableConfig.columnCount)
}

// 校验列表配置并通知主画布创建列表组件。
const confirmTableConfig = () => {
  if (!tableConfig.columns.length) {
    ElMessage.warning('请至少添加一列')
    return
  }

  const hasInvalidColumn = tableConfig.columns.some(col => !col.label?.trim() || !col.prop?.trim())
  if (hasInvalidColumn) {
    ElMessage.warning('请完善列名称和字段名')
    return
  }

  emit('create', {
    type: 'table',
    config: {
      selectionMode: tableConfig.selectionMode,
      columns: tableConfig.columns.map(column => ({ ...column }))
    }
  })

  tableConfigVisible.value = false
  resetTableConfig()
}

// 打开列表配置弹窗，作为中央画布接收拖拽后的配置入口。
const openTableConfig = () => {
  resetTableConfig()
  tableConfigVisible.value = true
}

defineExpose({
  openTableConfig
})
</script>

<style scoped>
.component-palette {
  display: flex;
  flex-direction: column;
  flex: 0 0 240px;
  min-width: 240px;
  min-height: 0;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e8ecf1;
}

.palette-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid #e8ecf1;
}

.palette-title {
  font-size: 14px;
  font-weight: 600;
  color: #172033;
}

.palette-body {
  flex: 1;
  min-height: 0;
}

.component-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 16px 12px;
}

.component-item {
  display: flex;
  min-height: 92px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 12px 8px;
  background: #f7f9fc;
  border: 1px solid #e8ecf1;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
}

.component-item:hover {
  background: #e8f4ff;
  border-color: #1677ff;
}

.component-item:active {
  cursor: grabbing;
}

.component-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.component-item.disabled:hover {
  background: #f7f9fc;
  border-color: #e8ecf1;
}

.component-icon {
  font-size: 24px;
  color: #1677ff;
}

.component-name {
  font-size: 13px;
  color: #172033;
  font-weight: 500;
  line-height: 1.4;
}

.column-config-row {
  display: flex;
  align-items: center;
  min-width: 0;
  margin-bottom: 10px;
}

.column-config-list {
  max-height: min(42vh, 360px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 2px 8px 2px 0;
}

.column-count-input {
  width: 180px;
}

.config-tip {
  color: #8a94a6;
  font-size: 12px;
}
</style>
