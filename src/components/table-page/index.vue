<script setup lang="ts">
import { computed } from "vue";

interface TableColumn {
  label: string
  prop: string
}

const props = withDefaults(defineProps<{
  tableData?: Record<string, unknown>[]
  tableColumns?: TableColumn[]
}>(), {
  tableData: () => [],
  tableColumns: () => []
})

const filterTableData = computed(() => props.tableData)
</script>

<template>
  <el-table :data="filterTableData" style="width: 100%">
    <el-table-column
      v-for="column in props.tableColumns"
      :key="column.prop"
      :label="column.label"
      :prop="column.prop"
    />
  </el-table>
</template>

<style scoped lang="less">

</style>
