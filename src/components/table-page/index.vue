<script setup lang="ts">
import {reactive, ref, onMounted} from "vue";

// 表格实例
const tableRef = ref(null)

// 拖拽状态
const draggingColumn: { label: string } | null = ref(null)
const dragStartIndex = ref(-1)
const dragOverIndex = ref(-1)
const isDragging = ref(false)
const previewStyle = reactive({
  left: '0px',
  top: '0px',
  opacity: 0,
})

// 拖拽预览元素
const dragPreviewRef = ref(null)

const tableDta = reactive({
  value: []
})

const filterTableData = reactive({
  value: []
})

const tableColumns = reactive({
  value: [
    {
      label: '菜单名称',
      prop: 'name',
    }
  ]
})

let resizingColumnIndex: number = 0

// 开始拖拽
const handleDragStart = (event, column) => {
  if (!column || !column.property) return

  draggingColumn.value = column
  dragStartIndex.value = columnConfigs.value.findIndex(col => col.prop === column.property)
  isDragging.value = true

  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', column.property)
  event.dataTransfer.effectAllowed = 'move'

  // 设置拖拽图像
  const dragImage = event.target.cloneNode(true)
  dragImage.style.position = 'absolute'
  dragImage.style.left = '-1000px'
  document.body.appendChild(dragImage)
  event.dataTransfer.setDragImage(dragImage, event.offsetX, event.offsetY)

  // 延迟移除拖拽图像
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)

  // 初始化预览位置
  updatePreviewPosition(event)
  previewStyle.opacity = 0.8

  // 添加拖拽类名
  event.target.classList.add('dragging')
}

// 拖拽经过
const handleDragOver = (event, column) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'

  if (!column || !column.property || !draggingColumn.value) return

  const currentIndex = columnConfigs.value.findIndex(col => col.prop === column.property)

  if (currentIndex !== -1 && currentIndex !== dragOverIndex.value) {
    dragOverIndex.value = currentIndex
    updatePreviewPosition(event)

    // 添加视觉反馈
    const headerElement = event.currentTarget
    headerElement.classList.add('drag-over')
  }
}

// 拖拽进入
const handleDragEnter = (event, column) => {
  event.preventDefault()

  if (!column || !column.property) return

  const headerElement = event.currentTarget
  const currentIndex = columnConfigs.value.findIndex(col => col.prop === column.property)

  // 确定插入方向
  const rect = headerElement.getBoundingClientRect()
  const x = event.clientX - rect.left
  const midpoint = rect.width / 2

  if (currentIndex > dragStartIndex.value) {
    // 向右拖拽
    headerElement.classList.add('drag-over-right')
    headerElement.classList.remove('drag-over-left')
  } else if (currentIndex < dragStartIndex.value) {
    // 向左拖拽
    headerElement.classList.add('drag-over-left')
    headerElement.classList.remove('drag-over-right')
  }
}

// 拖拽离开
const handleDragLeave = (event) => {
  const headerElement = event.currentTarget
  headerElement.classList.remove('drag-over', 'drag-over-left', 'drag-over-right')
}

// 放置
const handleDrop = (event, column) => {
  event.preventDefault()

  if (!column || !column.property || !draggingColumn.value) return

  const dropIndex = columnConfigs.value.findIndex(col => col.prop === column.property)

  if (dropIndex !== -1 && dragStartIndex.value !== -1 && dropIndex !== dragStartIndex.value) {
    // 重新排序列
    const newColumns = [...columnConfigs.value]
    const [removed] = newColumns.splice(dragStartIndex.value, 1)
    newColumns.splice(dropIndex, 0, removed)

    columnConfigs.value = newColumns

    // 清理样式
    const headerElement = event.currentTarget
    headerElement.classList.remove('drag-over', 'drag-over-left', 'drag-over-right')
  }
}

// 拖拽结束
const handleDragEnd = (event) => {
  // 清理所有状态
  isDragging.value = false
  draggingColumn.value = null
  dragStartIndex.value = -1
  dragOverIndex.value = -1
  previewStyle.opacity = 0

  // 移除所有相关样式
  const headers = document.querySelectorAll('.draggable-header')
  headers.forEach(header => {
    header.classList.remove('dragging', 'drag-over', 'drag-over-left', 'drag-over-right')
  })

  event.preventDefault()
}

// 更新预览位置
const updatePreviewPosition = (event) => {
  if (!dragPreviewRef.value) return

  previewStyle.left = `${event.clientX + 10}px`
  previewStyle.top = `${event.clientY + 10}px`
}

// 监听鼠标移动更新预览位置
onMounted(() => {
  document.addEventListener('dragover', (event) => {
    if (isDragging.value && dragPreviewRef.value) {
      updatePreviewPosition(event)
    }
  })
})

// 可选：处理列宽调整后的同步
const handleHeaderDragEnd = (newWidth, oldWidth, column, event) => {
  // 这里可以同步更新列配置的宽度
  const prop = column.property
  const colIndex = tableColumns.value.findIndex(col => col.prop === prop)
  if (colIndex !== -1) {
    tableColumns.value[colIndex].width = newWidth
  }
}

</script>

<template>
  <el-table ref="tableRef" :data="filterTableData" style="width: 100%">
    <el-table-column v-for="(column, index) in tableColumns.value" :key="column.prop" :label="column.label"
                     :prop="column.prop">
      <template #header>
        <div class="header-cell" @mousedown="startResizing(index, $event)">{{ column.label }}</div>
      </template>
    </el-table-column>
  </el-table>
  <div
      v-if="draggingColumn"
      ref="dragPreviewRef"
      class="drag-preview"
      :style="previewStyle"
  >
    {{ draggingColumn.label }}
  </div>
</template>

<style scoped lang="less">

</style>