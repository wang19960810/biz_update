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
      :context-type="paletteContextType"
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
        @pointerdown.capture="handleCanvasAreaPointerDown"
        @dragover.prevent="handleCanvasDragOver"
        @dragleave="handleCanvasDragLeave"
        @click="handleCanvasAreaClick"
        @drop.prevent="handleCanvasDrop"
      >
        <div v-if="showCanvas" class="canvas-content">
          <div v-if="!currentCanvasComponents.length" class="drop-placeholder">
            <el-icon :size="42"><Plus /></el-icon>
            <strong>拖动组件到这里</strong>
            <span>从左侧选择组件，拖入后开始编辑属性</span>
          </div>

          <div
            v-for="component in currentCanvasComponents"
            :key="component.id"
            class="canvas-component-card"
            :class="{ 'is-selected': selectedCanvasComponent?.id === component.id }"
            @click="handleCanvasComponentClick(component.id)"
          >
            <template v-if="component.type === 'table'">
              <el-table
                :data="getPreviewRows(component)"
                border
                stripe
                size="small"
                class="canvas-table"
                @header-click="handleTableHeaderClick(component, $event)"
              >
                <el-table-column
                  v-if="getTableSelectionMode(component) !== 'none'"
                  type="selection"
                  width="48"
                />
                <el-table-column
                  v-for="column in getVisibleTableColumns(component)"
                  :key="column.prop"
                  :prop="column.prop"
                  :label="column.label"
                  :width="column.width"
                  :min-width="column.minWidth"
                  :fixed="column.fixed || undefined"
                />
              </el-table>
            </template>

            <template v-else-if="component.type === 'button'">
              <div class="button-preview">
                <el-button
                  v-for="btn in getButtonItems(component)"
                  :key="btn.buttonCode"
                  size="small"
                  :type="btn.buttonType === 'primary' ? 'primary' : 'default'"
                >
                  {{ btn.buttonName }}
                </el-button>
              </div>
            </template>

            <template v-else>
              <div class="header-preview">
                <div class="header-preview-main">
                  <strong>{{ getHeaderTitle(component) }}</strong>
                  <p>{{ getHeaderDescription(component) }}</p>
                </div>
                <div class="header-preview-stats">
                  <span v-for="stat in getHeaderStats(component)" :key="stat.label" class="header-stat">
                    {{ stat.label }} <strong>{{ stat.value }}</strong>
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div v-else class="empty-placeholder">
          <el-icon :size="80" color="#8a94a6"><FolderOpened /></el-icon>
          <p class="empty-text">请从左侧选择列表或表单节点开始设计页面</p>
        </div>
      </div>
    </main>
    <ComponentPropertyPanel
      v-if="showPropertyPanel"
      :component="selectedCanvasComponent"
      :page-config="selectedMenu?.pageConfig || null"
      :table-column-index="selectedCanvasComponent ? getSelectedTableColumnIndex(selectedCanvasComponent) : 0"
      :collapsed="propertyPanelCollapsed"
      @update:table-column-index="handleTableColumnIndexChange"
      @update:collapsed="handlePropertyPanelCollapsedChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { MenuItem } from '@pages/biz-tools/types'
import MenuTreePanel from './components/menu-tree-panel.vue'
import ComponentPalette from './components/component-palette.vue'
import ComponentPropertyPanel from './components/component-property-panel.vue'
import type {
  ButtonComponentConfig,
  CanvasComponent,
  CanvasComponentType,
  ComponentCreatePayload,
  HeaderComponentConfig,
  TableComponentConfig
} from './component-types'
import {
  createLocalComponentData,
  restoreCanvasComponent
} from './component-storage'
import {
  createDefaultComponentConfig,
  createDefaultComponentName,
  getComponentTypeLabel
} from './component-presets'
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
const selectedComponentIdByMenu = reactive<Record<string, string>>({})
// 按组件实例记录当前选中的列表列，画布表头和右侧属性面板共用这个状态。
const selectedTableColumnIndexByComponent = reactive<Record<string, number>>({})
const propertyPanelCollapsed = ref(false)
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
  propertyPanelCollapsed.value = false

  // 切换菜单时，如果当前菜单还没有加载组件，尝试从数据库恢复。
  // 菜单节点本身没有页面数据，只有页面、列表、表单才需要加载画布。
  if (menu && !canvasComponentsByMenu[menu.id] && menu.builderType !== 'folder') {
    void loadComponentsForMenu(menu)
  }
}

// 选择画布中的某个组件，右侧属性面板随之联动。
const selectCanvasComponent = (componentId: string) => {
  const menuId = selectedMenu.value?.id

  if (!menuId) {
    return
  }

  selectedComponentIdByMenu[menuId] = componentId
}

// 点击组件时默认展开属性面板，方便直接编辑。
const handleCanvasComponentClick = (componentId: string) => {
  propertyPanelCollapsed.value = false
  selectCanvasComponent(componentId)
}

// 点击画布空白处收起属性面板。
const handleCanvasAreaPointerDown = (event: PointerEvent) => {
  const target = event.target as HTMLElement | null

  if (target?.closest('.canvas-component-card')) {
    return
  }

  propertyPanelCollapsed.value = true
}

// 兜底处理普通 click，保证某些浏览器/组件组合下也能收起。
const handleCanvasAreaClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null

  if (target?.closest('.canvas-component-card')) {
    return
  }

  propertyPanelCollapsed.value = true
}

// 统一处理属性面板的折叠状态更新，避免模板里直接赋值。
const handlePropertyPanelCollapsedChange = (collapsed: boolean) => {
  propertyPanelCollapsed.value = collapsed
}

// 获取当前列表组件在画布上选中的列下标。
const getSelectedTableColumnIndex = (component: CanvasComponent) => {
  return selectedTableColumnIndexByComponent[component.id] ?? 0
}

// 点击画布列表表头时，切换右侧属性面板到对应列。
const handleTableHeaderClick = (
  component: CanvasComponent,
  column: { property?: string }
) => {
  selectCanvasComponent(component.id)

  const property = String(column?.property || '')
  const index = getTableColumns(component).findIndex(item => item.prop === property)

  if (index >= 0) {
    selectedTableColumnIndexByComponent[component.id] = index
  }
}

// 右侧属性面板切换列时，同步回画布状态，保证再次点击组件后仍然定位到当前列。
const handleTableColumnIndexChange = (index: number) => {
  const component = selectedCanvasComponent.value

  if (component?.type === 'table') {
    selectedTableColumnIndexByComponent[component.id] = index
  }
}

// 当前选中菜单对应的画布组件列表。
const currentCanvasComponents = computed(() => {
  const menuId = selectedMenu.value?.id
  return menuId ? (canvasComponentsByMenu[menuId] || []) : []
})

// 当前菜单选中的画布组件。
const selectedCanvasComponent = computed(() => {
  const menuId = selectedMenu.value?.id

  if (!menuId) {
    return null
  }

  const selectedId = selectedComponentIdByMenu[menuId]
  return currentCanvasComponents.value.find(item => item.id === selectedId) || currentCanvasComponents.value[0] || null
})

const paletteContextType = computed(() => {
  if (selectedMenu.value?.builderType === 'form') {
    return 'form' as const
  }

  if (selectedMenu.value?.builderType === 'list') {
    return 'list' as const
  }

  return null
})

// 列表和表单页面才允许放置画布组件。
const isCanvasTargetMenu = (menu: MenuItem | null) => {
  return menu?.builderType === 'list' || menu?.builderType === 'form'
}

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

  if (componentType !== 'table' && componentType !== 'button' && componentType !== 'custom-header') {
    return
  }

  if (!isCanvasTargetMenu(selectedMenu.value)) {
    ElMessage.warning('请先选择列表或表单节点')
    return
  }

  if (componentType === 'table') {
    componentPaletteRef.value?.openTableConfig()
    return
  }

  handleComponentCreate({
    type: componentType as CanvasComponentType,
    config: createDefaultComponentConfig(componentType as CanvasComponentType)
  })
}

// 配置完成后把组件实例放入当前页面画布。
const handleComponentCreate = (payload: ComponentCreatePayload) => {
  const menuId = selectedMenu.value?.id

  if (!isCanvasTargetMenu(selectedMenu.value) || !menuId) {
    ElMessage.warning('请先选择列表或表单节点')
    return
  }

  const components = canvasComponentsByMenu[menuId] || (canvasComponentsByMenu[menuId] = [])
  const component: CanvasComponent = {
    id: `canvas_${payload.type}_${Date.now()}`,
    type: payload.type,
    name: createDefaultComponentName(payload.type),
    config: payload.config
  }

  components.push(component)
  selectedComponentIdByMenu[menuId] = component.id
  ElMessage.success(`${getComponentTypeLabel(payload.type)}组件已添加到画布`)
}

// 从联合类型组件里读取列表配置，模板里不再直接访问联合属性。
const getTableConfig = (component: CanvasComponent) => component.config as TableComponentConfig

const getButtonConfig = (component: CanvasComponent) => component.config as ButtonComponentConfig

const getHeaderConfig = (component: CanvasComponent) => component.config as HeaderComponentConfig

const getTableSelectionMode = (component: CanvasComponent) => {
  return component.type === 'table' ? getTableConfig(component).selectionMode : 'none'
}

const getTableColumns = (component: CanvasComponent) => {
  return component.type === 'table' ? getTableConfig(component).columns : []
}

// 只渲染列表里开启显隐状态的列。
const getVisibleTableColumns = (component: CanvasComponent) => {
  return getTableColumns(component).filter(column => column.visible !== false)
}

const getButtonItems = (component: CanvasComponent) => {
  return component.type === 'button' ? getButtonConfig(component).buttons : []
}

const getHeaderStats = (component: CanvasComponent) => {
  return component.type === 'custom-header' ? getHeaderConfig(component).stats : []
}

const getHeaderTitle = (component: CanvasComponent) => {
  return component.type === 'custom-header' ? getHeaderConfig(component).title : ''
}

const getHeaderDescription = (component: CanvasComponent) => {
  return component.type === 'custom-header' ? getHeaderConfig(component).description : ''
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
    selectedComponentIdByMenu[menu.id] = canvasComponentsByMenu[menu.id]?.[0]?.id || ''
  } catch {
    // 页面还没有完成本地生成时，或者是菜单节点请求404，先展示空画布。
    canvasComponentsByMenu[menu.id] = []
    selectedComponentIdByMenu[menu.id] = ''
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

// 生成空数据行，让用户在画布中直接看到列结构。
const getPreviewRows = (component: CanvasComponent) => {
  const columns = getVisibleTableColumns(component)

  return Array.from({ length: 3 }, (_, rowIndex) => {
    return Object.fromEntries(columns.map(column => [
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
  cursor: pointer;
}

.canvas-component-card.is-selected {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12), 0 8px 24px rgba(31, 45, 61, 0.08);
}

.canvas-table {
  width: 100%;
}

.button-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.header-preview {
  padding: 14px 16px;
  border: 1px dashed #d9e2ef;
  border-radius: 12px;
  background: linear-gradient(180deg, #fbfdff, #f8fbff);
}

.header-preview-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-preview-main p {
  margin: 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
}

.header-preview-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.header-stat {
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: #eef4ff;
  color: #3555aa;
  font-size: 12px;
}

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
</style>
