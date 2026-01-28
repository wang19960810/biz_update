<script setup lang="ts">
import {reactive, ref, onMounted, defineProps} from "vue";

const props = defineProps([''])

// 表格实例
const tableRef = ref(null)


// 列表渲染数据
const filterTableData = reactive({value: []})

// 监听鼠标移动更新预览位置
onMounted(() => {

})



</script>

<template>
  <el-table ref="tableRef" :data="filterTableData.value" style="width: 100%">
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