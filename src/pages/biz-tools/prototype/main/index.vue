<template>
  <div class="editor-container">
    <aside class="left-sidebar" :class="{ 'is-collapsed': treeCollapsed }">
      <div class="logo-area">
        <template v-if="!treeCollapsed">
          <div class="sidebar-title-row">
            <span class="sidebar-kicker">PageBuilder</span>
            <span class="sidebar-title">项目</span>
          </div>
        </template>

        <el-button
          text
          size="small"
          class="sidebar-collapse-btn"
          :icon="treeCollapsed ? icons.Expand : icons.Fold"
          @click="treeCollapsed = !treeCollapsed"
        />
      </div>
      <MenuTreePanel v-model:collapsed="treeCollapsed" @select="handleMenuSelect" />
    </aside>

    <!-- 组件选择面板 -->
    <ComponentPalette v-if="showComponentPalette" ref="componentPaletteRef" />

    <main class="main-workspace">
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

      <div class="canvas-area">
        <div v-if="showCanvas" class="canvas-content">
          <div class="preview-card">
            <img src="https://placehold.co/800x450/1a1a1a/FFF?text=Dashboard+Preview" alt="Dashboard Preview" class="preview-img" />
            <div class="play-overlay">
              <el-icon :size="40"><VideoPlay /></el-icon>
            </div>
          </div>
        </div>
        <div v-else class="empty-placeholder">
          <el-icon :size="80" color="#8a94a6"><FolderOpened /></el-icon>
          <p class="empty-text">请从左侧选择列表或表单节点开始设计页面</p>
        </div>
      </div>
    </main>
    <aside v-if="showPropertyPanel" class="right-panel">
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

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { MenuItem } from '@pages/biz-tools/types'
import MenuTreePanel from './components/menu-tree-panel.vue'
import ComponentPalette from './components/component-palette.vue'

// 统一收口图标引用，模板里直接取别名即可。
const icons = {
  Undo: ElementPlusIconsVue.RefreshLeft,
  Redo: ElementPlusIconsVue.RefreshRight,
  Fold: ElementPlusIconsVue.Fold,
  Expand: ElementPlusIconsVue.Expand,
  VideoPlay: ElementPlusIconsVue.VideoPlay,
  FolderOpened: ElementPlusIconsVue.FolderOpened
}

const deviceType = ref('pc')
// 左上角树面板的折叠状态。
const treeCollapsed = ref(false)
const componentPaletteRef = ref(null)
// 当前选中的菜单节点。
const selectedMenu = ref<MenuItem | null>(null)

// 处理菜单树选中事件。
const handleMenuSelect = (menu: MenuItem | null) => {
  selectedMenu.value = menu
}

// 只有选中列表或表单节点时，才显示组件栏、画布和属性面板。
const showComponentPalette = computed(() => {
  return selectedMenu.value?.builderType === 'list' || selectedMenu.value?.builderType === 'form'
})

const showCanvas = computed(() => {
  return showComponentPalette.value
})

const showPropertyPanel = computed(() => {
  return showComponentPalette.value
})

// 中间画布右侧属性栏的示例数据。
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
  width: 260px;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s ease;
}

.left-sidebar.is-collapsed {
  width: 76px;
}

.logo-area {
  min-height: 34px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid #e4e7ed;
}

.left-sidebar.is-collapsed .logo-area {
  padding: 16px 10px 12px;
}

.sidebar-kicker {
  margin: 0;
  color: #8a94a6;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sidebar-title {
  color: #172033;
  font-size: 18px;
  font-weight: 700;
}

.sidebar-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-top: 8px;
}

.sidebar-collapse-btn {
  font-size: 22px;
  flex-shrink: 0;
  color: #5f6b7a;
  margin-top: -2px;
  padding: 0;
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
/* 空状态占位 */
.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8a94a6;
}

.empty-text {
  margin-top: 20px;
  font-size: 14px;
  color: #8a94a6;
}
