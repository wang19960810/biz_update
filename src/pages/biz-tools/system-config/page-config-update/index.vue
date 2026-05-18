<script setup lang="ts">
import AddMenuPanel from "../components/add-menu-panel.vue"
</script>

<template>
  <div class="standalone-page">
    <AddMenuPanel default-tab="page-data" />
  </div>
</template>

<style scoped lang="less">
.standalone-page {
  min-height: 100%;
  box-sizing: border-box;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 28%),
    radial-gradient(circle at 85% 12%, rgba(14, 116, 144, 0.16), transparent 24%),
    linear-gradient(135deg, #f5efe2 0%, #f7f8fb 48%, #eef4f8 100%);
}

@media (max-width: 768px) {
  .standalone-page {
    padding: 16px;
  }
}
</style>
