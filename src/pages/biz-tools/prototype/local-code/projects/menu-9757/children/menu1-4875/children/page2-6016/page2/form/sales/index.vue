<template>
  <section class="form-shell">
    <header class="form-head">
      <div>
        <p class="form-kicker">PageBuilder</p>
        <h2>{{ pageName }} - {{ formName }}</h2>
      </div>
    </header>

    <el-form label-position="right" label-width="96px" class="form-body">
      <el-form-item label="名称">
        <el-input />
      </el-form-item>
      <el-form-item label="编码">
        <el-input />
      </el-form-item>
      <el-form-item label="备注">
        <el-input type="textarea" :rows="4" />
      </el-form-item>
    </el-form>
  </section>
</template>

<script setup lang="ts">
const pageName = "页面2"
const formName = "销售表单"
</script>

<style scoped>
.form-shell {
  min-height: 100%;
  padding: 20px;
  background: #fff;
}

.form-head {
  margin-bottom: 16px;
}

.form-kicker {
  margin: 0 0 4px;
  color: #8a94a6;
  font-size: 12px;
}

.form-head h2 {
  margin: 0;
  font-size: 20px;
  color: #172033;
}

.form-body {
  max-width: 760px;
}
</style>
