<template>
  <section class="page-shell">
    <header class="page-head">
      <div>
        <p class="page-kicker">PageBuilder</p>
        <h2>{{ pageName }}</h2>
      </div>
      <el-button type="primary">新增</el-button>
    </header>

    <el-form :inline="true" size="small" class="query-bar">
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="请输入关键字" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="rows" border stripe>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="code" label="编码" />
      <el-table-column prop="status" label="状态" width="120" />
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const query = reactive({ keyword: '' })
const rows = ref<Array<{ name: string; code: string; status: string }>>([])
const pageName = "页面2"
</script>

<style scoped>
.page-shell {
  min-height: 100%;
  padding: 20px;
  background: #fff;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-kicker {
  margin: 0 0 4px;
  color: #8a94a6;
  font-size: 12px;
}

.page-head h2 {
  margin: 0;
  font-size: 20px;
  color: #172033;
}

.query-bar {
  margin-bottom: 16px;
}
</style>
