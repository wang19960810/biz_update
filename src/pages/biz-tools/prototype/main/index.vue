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
    <ComponentPalette
      v-if="showComponentPalette"
      ref="componentPaletteRef"
      @create="handleComponentCreate"
    />

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
          <el-button
            v-if="showCanvas && currentCanvasComponents.length"
            type="primary"
            :loading="saving"
            @click="saveComponents"
          >
            保存组件
          </el-button>
        </div>
      </header>

      <div
        class="canvas-area"
        :class="{ 'is-dragging': canvasDragActive }"
        @dragover.prevent="handleCanvasDragOver"
        @dragleave="handleCanvasDragLeave"
        @drop.prevent="handleCanvasDrop"
      >
        <div v-if="showCanvas" class="canvas-content">
          <div v-if="!currentCanvasComponents.length" class="drop-placeholder">
            <el-icon :size="42"><Plus /></el-icon>
            <strong>拖动组件到这里</strong>
            <span>从左侧选择“列表”，拖入后配置列数量和选择模式</span>
          </div>

          <div
            v-for="component in currentCanvasComponents"
            :key="component.id"
            class="canvas-component-card"
          >
            <div class="canvas-component-head">
              <div>
                <span class="component-type-label">列表</span>
                <strong>列表组件</strong>
              </div>
              <span class="selection-label">{{ selectionModeLabel(component.config.selectionMode) }}</span>
            </div>

            <el-table :data="getPreviewRows(component)" border stripe size="small" class="canvas-table">
              <el-table-column
                v-if="component.config.selectionMode !== 'none'"
                type="selection"
                width="48"
              />
              <el-table-column
                v-for="column in component.config.columns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                :width="column.width"
              />
            </el-table>
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
import { ElMessage } from 'element-plus'
import type { MenuItem } from '@pages/biz-tools/types'
import MenuTreePanel from './components/menu-tree-panel.vue'
import ComponentPalette from './components/component-palette.vue'
import type { CanvasComponent, ComponentCreatePayload } from './component-types'
import { createLocalComponentData, restoreCanvasComponent } from './component-storage'
import {
  loadPageBuilderPageData,
  savePageBuilderPageData
} from './page-builder-api'

// 统一收口图标引用，模板里直接取别名即可。
const icons = {
  Undo: ElementPlusIconsVue.RefreshLeft,
  Redo: ElementPlusIconsVue.RefreshRight,
  Fold: ElementPlusIconsVue.Fold,
  Expand: ElementPlusIconsVue.Expand,
  FolderOpened: ElementPlusIconsVue.FolderOpened,
  Plus: ElementPlusIconsVue.Plus
}

const deviceType = ref('pc')
// 左上角树面板的折叠状态。
const treeCollapsed = ref(false)
const componentPaletteRef = ref<InstanceType<typeof ComponentPalette> | null>(null)
// 当前选中的菜单节点。
const selectedMenu = ref<MenuItem | null>(null)
// 当前页面的画布组件，按菜单 ID 分组，切换菜单时不会丢失本次编辑结果。
const canvasComponentsByMenu = reactive<Record<string, CanvasComponent[]>>({})
const canvasDragActive = ref(false)
const saving = ref(false)
const loadedPageIds = new Set<string>()

// 页面 ID 由服务端按菜单编码生成；已有数据库映射优先使用 pageId。
const resolvePageId = (menu: MenuItem) => {
  if (menu.pageId) {
    return menu.pageId
  }

  const pageCode = String(menu.builderType === 'page' ? menu.code : menu.parentCode || '').trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return pageCode ? `page_${pageCode}` : ''
}

// 处理菜单树选中事件。
const handleMenuSelect = (menu: MenuItem | null) => {
  selectedMenu.value = menu

  // 切换菜单时，如果当前菜单还没有加载组件，尝试从数据库恢复。
  // 菜单节点本身没有页面数据，只有页面、列表、表单才需要加载画布。
  if (menu && !canvasComponentsByMenu[menu.id] && menu.builderType !== 'folder') {
    void loadComponentsForMenu(menu)
  }
}

// 当前选中菜单对应的画布组件列表。
const currentCanvasComponents = computed(() => {
  const menuId = selectedMenu.value?.id
  return menuId ? (canvasComponentsByMenu[menuId] || []) : []
})

// 处理组件拖入画布上方的视觉状态。
const handleCanvasDragOver = () => {
  canvasDragActive.value = true
}

// 拖拽离开画布时取消高亮。
const handleCanvasDragLeave = (event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }

  canvasDragActive.value = false
}

// 接收组件面板拖拽，列表需要先经过配置弹窗再创建实例。
const handleCanvasDrop = (event: DragEvent) => {
  canvasDragActive.value = false
  const componentType = event.dataTransfer?.getData('component-type')

  if (componentType !== 'table') {
    return
  }

  if (!selectedMenu.value || selectedMenu.value.builderType !== 'list') {
    ElMessage.warning('请先选择列表节点')
    return
  }

  componentPaletteRef.value?.openTableConfig()
}

// 配置完成后把组件实例放入当前页面画布。
const handleComponentCreate = (payload: ComponentCreatePayload) => {
  const menuId = selectedMenu.value?.id

  if (!menuId) {
    ElMessage.warning('请先选择列表节点')
    return
  }

  const components = canvasComponentsByMenu[menuId] || (canvasComponentsByMenu[menuId] = [])
  const component: CanvasComponent = {
    id: `canvas_${payload.type}_${Date.now()}`,
    type: payload.type,
    config: payload.config
  }

  components.push(component)
  ElMessage.success('列表组件已添加到画布')
}

// 从本地数据库加载当前菜单的组件。
const loadComponentsForMenu = async (menu: MenuItem) => {
  // 菜单容器节点不需要加载画布数据。
  if (!menu.id || menu.builderType === 'folder') {
    return
  }

  const pageId = resolvePageId(menu)

  if (!pageId || loadedPageIds.has(pageId)) {
    return
  }

  try {
    const response = await loadPageBuilderPageData(pageId)
    const pageData = response.data?.data
    const storedComponents = Array.isArray(pageData?.renderData?.components)
      ? pageData.renderData.components
      : []

    canvasComponentsByMenu[menu.id] = storedComponents
      .filter((item: { menuId?: string }) => item.menuId === menu.id)
      .map(restoreCanvasComponent)
    loadedPageIds.add(pageId)
  } catch {
    // 页面还没有完成本地生成时，或者是菜单节点请求404，先展示空画布。
    canvasComponentsByMenu[menu.id] = []
  }
}

// 保存当前菜单的组件到本地数据库。
const saveComponents = async () => {
  const menu = selectedMenu.value

  if (!menu || !menu.id) {
    ElMessage.warning('请先选择菜单')
    return
  }

  const components = currentCanvasComponents.value
  const pageId = resolvePageId(menu)

  if (!pageId) {
    ElMessage.warning('当前菜单尚未关联页面数据')
    return
  }

  saving.value = true

  try {
    const localData = components.map(comp =>
      createLocalComponentData(comp, menu, pageId)
    )

    await savePageBuilderPageData(pageId, {
      menuId: menu.id,
      components: localData
    })

    // 标记所有组件为已保存
    components.forEach((comp, index) => {
      const savedData = localData[index]
      comp.saved = true
      if (savedData) {
        comp.componentId = savedData.componentId
      }
    })

    ElMessage.success('组件已保存')
    loadedPageIds.add(pageId)
    console.info('[PageBuilder] 组件已保存到页面数据文件', localData)
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败'
    ElMessage.error(message)
  } finally {
    saving.value = false
  }
}

// 将选择模式转换成画布上的简洁提示。
const selectionModeLabel = (mode: CanvasComponent['config']['selectionMode']) => {
  return mode === 'multiple' ? '多选' : mode === 'single' ? '单选' : '无选择'
}

// 生成空数据行，让用户在画布中直接看到列结构。
const getPreviewRows = (component: CanvasComponent) => {
  return Array.from({ length: 3 }, (_, rowIndex) => {
    return Object.fromEntries(component.config.columns.map(column => [
      column.prop,
      `${column.label || '列'} ${rowIndex + 1}`
    ]))
  })
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
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* --- 左侧边栏 --- */
.left-sidebar {
  flex: 0 0 260px;
  min-width: 0;
  min-height: 0;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s ease;
}

.left-sidebar.is-collapsed {
  flex-basis: 76px;
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
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f0f2f5; /* 浅灰背景 */
}

.top-toolbar {
  flex: 0 0 60px;
  min-width: 0;
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
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 20px;
  display: block;
  transition: background-color 0.2s ease;
}

.canvas-area.is-dragging {
  background: #e9f4ff;
}

.canvas-content {
  width: 1024px;
  min-width: 1024px;
  min-height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}

.drop-placeholder {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #1677ff;
  border: 2px dashed #b7d7ff;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.76);
}

.drop-placeholder strong {
  color: #172033;
  font-size: 18px;
}

.drop-placeholder span {
  color: #8a94a6;
  font-size: 13px;
}

.canvas-component-card {
  padding: 16px;
  background: #fff;
  border: 1px solid #dfe6ef;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(31, 45, 61, 0.06);
}

.canvas-component-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.canvas-component-head > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.component-type-label,
.selection-label {
  color: #1677ff;
  font-size: 12px;
}

.selection-label {
  color: #5f6b7a;
}

.canvas-table {
  width: 100%;
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
  flex: 0 0 300px;
  min-width: 300px;
  min-height: 0;
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
