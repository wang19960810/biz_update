<template>
  <div class="editor-container">
    <!-- 左侧：工具/导航栏 -->
    <aside class="left-sidebar">
      <div class="logo-area">MOM 设计器</div>
      <el-menu default-active="1" class="menu-list">
        <el-menu-item index="1">
          <el-icon><component :is="icons.Layout" /></el-icon>
          <span>基础组件</span>
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><component :is="icons.ChartLine" /></el-icon>
          <span>图表组件</span>
        </el-menu-item>
        <el-menu-item index="3">
          <el-icon><component :is="icons.List" /></el-icon>
          <span>列表组件</span>
        </el-menu-item>
      </el-menu>

      <div class="bottom-actions">
        <el-button type="primary" size="small" style="width: 100%">保存项目</el-button>
      </div>
    </aside>

    <!-- 中间：主要工作区 -->
    <main class="main-workspace">
      <!-- 顶部工具栏 -->
      <header class="top-toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button :icon="icons.Undo" />
            <el-button :icon="icons.Redo" />
          </el-button-group>
          <span class="divider">|</span>
          <el-select v-model="deviceType" placeholder="选择设备" style="width: 120px">
            <el-option label="PC端" value="pc" />
            <el-option label="移动端" value="mobile" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button type="success">预览</el-button>
          <el-button type="primary">发布</el-button>
        </div>
      </header>

      <!-- 画布区域 -->
      <div class="canvas-area">
        <div class="canvas-content">
          <!-- 模拟图片中的仪表盘预览 -->
          <div class="preview-card">
            <img src="https://placehold.co/800x450/1a1a1a/FFF?text=Dashboard+Preview" alt="Dashboard Preview" class="preview-img" />
            <div class="play-overlay">
              <el-icon :size="40"><VideoPlay /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 右侧：属性配置面板 -->
    <aside class="right-panel">
      <div class="panel-header">
        <span>属性设置</span>
      </div>

      <el-scrollbar class="panel-body">
        <!-- 分组：通用设置 -->
        <div class="config-section">
          <h3 class="section-title">基础信息</h3>
          <el-form label-position="top" size="small">
            <el-form-item label="组件名称">
              <el-input v-model="formData.name" />
            </el-form-item>
            <el-form-item label="唯一标识 (ID)">
              <el-input v-model="formData.id" disabled />
            </el-form-item>
          </el-form>
        </div>

        <!-- 分组：样式设置 -->
        <div class="config-section">
          <h3 class="section-title">样式配置</h3>
          <el-form label-position="top" size="small">
            <el-form-item label="背景颜色">
              <el-color-picker v-model="formData.bgColor" show-alpha />
            </el-form-item>

            <el-form-item label="圆角大小 (px)">
              <el-slider v-model="formData.borderRadius" :max="50" show-input />
            </el-form-item>

            <el-form-item label="透明度">
              <el-slider v-model="formData.opacity" :max="100" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 分组：数据源 -->
        <div class="config-section">
          <h3 class="section-title">数据绑定</h3>
          <el-form label-position="top" size="small">
            <el-form-item label="数据接口 URL">
              <el-input v-model="formData.apiUrl" placeholder="/api/data/dashboard" />
            </el-form-item>
            <el-form-item label="刷新频率 (秒)">
              <el-input-number v-model="formData.refreshRate" :min="1" />
            </el-form-item>
          </el-form>
        </div>
      </el-scrollbar>
    </aside>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 图标映射，方便模板中使用
const icons = {
  Layout: ElementPlusIconsVue.Grid,
  ChartLine: ElementPlusIconsVue.TrendCharts,
  List: ElementPlusIconsVue.List,
  Undo: ElementPlusIconsVue.RefreshLeft,
  Redo: ElementPlusIconsVue.RefreshRight,
  VideoPlay: ElementPlusIconsVue.VideoPlay
}

// 模拟的状态数据
const deviceType = ref('pc')

const formData = reactive({
  name: '仪表盘主视图',
  id: 'comp_dashboard_001',
  bgColor: '#1a1a1a',
  borderRadius: 12,
  opacity: 100,
  apiUrl: '',
  refreshRate: 30
})
</script>

<style scoped>
/* 全局布局：Flex 三栏布局 */
.editor-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* --- 左侧边栏 --- */
.left-sidebar {
  width: 220px;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  padding-left: 20px;
  font-weight: bold;
  font-size: 18px;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
}

.menu-list {
  border-right: none !important;
  flex: 1;
}

.bottom-actions {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
}

/* --- 中间工作区 --- */
.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5; /* 浅灰背景 */
}

.top-toolbar {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.divider {
  color: #dcdfe6;
}

.canvas-area {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-card {
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.preview-img {
  display: block;
  max-width: 100%;
  max-height: 80vh;
}

.play-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0,0,0,0.3);
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-card:hover .play-overlay {
  opacity: 1;
}

/* --- 右侧属性面板 --- */
.right-panel {
  width: 300px;
  background-color: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: bold;
  border-bottom: 1px solid #e4e7ed;
}

.panel-body {
  padding: 20px;
}

.config-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 15px;
  font-weight: normal;
}
</style>