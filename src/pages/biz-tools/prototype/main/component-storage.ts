import type { MenuItem } from '@pages/biz-tools/types'
import type { CanvasComponent, LocalComponentData, TableComponentConfig } from './component-types'

/**
 * 从画布组件生成本地数据库存储记录。
 */
export const createLocalComponentData = (
  component: CanvasComponent,
  menu: MenuItem,
  pageId: string
): LocalComponentData => {
  const now = new Date().toISOString()
  const componentId = component.componentId || `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  return {
    componentId,
    menuId: menu.id,
    pageId,
    componentType: component.type === 'table' ? 'table' : 'custom',
    componentName: component.type === 'table' ? '列表组件' : '组件',
    canvasConfig: component.config,
    sortIndex: 0,
    visible: true,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 从本地数据库记录恢复画布组件。
 */
export const restoreCanvasComponent = (data: LocalComponentData): CanvasComponent => {
  return {
    id: data.componentId,
    componentId: data.componentId,
    type: data.componentType === 'table' ? 'table' : 'table',
    config: data.canvasConfig as TableComponentConfig,
    saved: true
  }
}

/**
 * 从画布列表组件生成系统 PageConfigDetail 数组。
 *
 * PageConfig 已经在菜单的 pageConfig 字段中，这里只需要生成列定义。
 */
export const createPageConfigDetailsFromTable = (
  component: CanvasComponent,
  menu: MenuItem,
  parentMenu: MenuItem
): import('@pages/biz-tools/types').PageConfigDetail[] => {
  const config = component.config as TableComponentConfig

  return config.columns.map((column, index) => ({
    columnExport: '1', // 默认允许导出
    dictCode: null,
    editView: null,
    editableInCreate: '1', // 默认新增时可编辑
    editableInEdit: '1', // 默认编辑时可编辑
    entityFieldName: column.prop,
    field: column.prop,
    title: column.label,
    fixed: null,
    formorder: String(index + 1),
    functionCode: menu.code,
    parentCode: parentMenu.code,
    search: null,
    type: 'input', // 默认输入框类型
    visibleInEdit: '1',
    visibleInLook: '1',
    width: column.width ? String(column.width) : '150',
    align: null,
    className: null,
    col: null,
    formControl: null,
    formon: null,
    formoptions: null,
    formvalue: null,
    id: '', // 新增时为空，后端会生成
    isLimited: false,
    multilineSeparatorInfo: '',
    props: null,
    refresh: false,
    requestSearch: null,
    requestUrl: null,
    required: true,
    searchType: 'input',
    showOverflow: true,
    validate: null,
    visible: true
  }))
}
