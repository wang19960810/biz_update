// 生成自定义组件实体的 Vue 文件。
export const renderComponentVue = (page, componentName = '自定义组件') => {
  return `<template>
  <div class="component-shell">{{ pageName }} - {{ componentName }}</div>
</template>

<script setup lang="ts">
const pageName = ${JSON.stringify(page.pageName)}
const componentName = ${JSON.stringify(componentName)}
</script>

<style scoped>
.component-shell {
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px dashed rgba(23, 32, 51, 0.16);
  border-radius: 10px;
  color: #5d697f;
  background: rgba(23, 32, 51, 0.02);
}
</style>
`
}
