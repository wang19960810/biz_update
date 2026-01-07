<script setup lang="ts">
import {ref} from 'vue';
import { Calendar } from '@element-plus/icons-vue'

import MenuList from "./component/menu-list.vue";
import AddMenu from "./component/add-menu.vue";
import HistoryMenu from "./component/history-menu.vue";

const activeName = ref<string>('add-menu')

const loading = ref<boolean>(false);


</script>

<template>

  <div class="menu-page">
    <el-tabs type="border-card" v-loading="loading" v-model="activeName" class="demo-tabs">
      <el-tab-pane label="可新增菜单" name="add-menu">
        <AddMenu v-if="activeName === 'add-menu'" ></AddMenu>
      </el-tab-pane>
      <el-tab-pane label="菜单(测试/正式)" name="menu">
        <MenuList v-if="activeName === 'menu'"></MenuList>
      </el-tab-pane>

      <el-tab-pane label="操作历史" name="history-menu">
        <template #label>
        <span class="custom-tabs-label">
          <el-icon><calendar /></el-icon>
          <span>操作历史</span>
        </span>
        </template>
        <HistoryMenu></HistoryMenu>
      </el-tab-pane>
    </el-tabs>

  </div>

</template>

<style scoped lang="less">
.custom-tabs-label{
  display: flex;
  align-items: center;
}
</style>