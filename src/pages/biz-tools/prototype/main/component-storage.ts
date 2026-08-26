import type { MenuItem } from '@pages/biz-tools/types'
import { normalizeTableColumnConfig } from './component-presets'
import type {
  CanvasComponent,
  CanvasComponentConfig,
  CanvasComponentType,
  LocalComponentData,
  TableComponentConfig
} from './component-types'

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
    componentType: component.type,
    componentName: component.name,
    canvasConfig: component.config as CanvasComponentConfig,
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
  const config = data.componentType === 'table' && data.canvasConfig && typeof data.canvasConfig === 'object'
    ? {
        ...(data.canvasConfig as TableComponentConfig),
        columns: Array.isArray((data.canvasConfig as TableComponentConfig).columns)
          ? (data.canvasConfig as TableComponentConfig).columns.map((column, index) =>
              normalizeTableColumnConfig(column, index + 1)
            )
          : []
      }
    : (data.canvasConfig as CanvasComponentConfig)

  return {
    id: data.componentId,
    componentId: data.componentId,
    type: data.componentType as CanvasComponentType,
    name: data.componentName || '组件',
    config,
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
  const selectionDetail = config.selectionMode === 'none'
    ? null
    : createSelectionPageConfigDetail(config.selectionMode, menu, parentMenu)

  const columnDetails = config.columns.map((column, index) => ({
    columnExport: column.columnExport === false ? '0' : '1',
    dictCode: column.dictCode ? column.dictCode : null,
    editView: column.clickView ? '1' : null,
    editableInCreate: '1',
    editableInEdit: '1',
    entityFieldName: column.prop,
    field: column.prop,
    title: column.label,
    fixed: column.fixed || null,
    formorder: String(column.displayOrder || index + 1),
    functionCode: menu.code,
    parentCode: parentMenu.code,
    search: column.search ? '1' : null,
    type: column.searchType || 'input',
    visibleInEdit: column.visible === false ? '0' : '1',
    visibleInLook: column.visible === false ? '0' : '1',
    width: column.width !== undefined ? String(column.width) : '',
    align: null,
    className: null,
    col: null,
    formControl: null,
    formon: null,
    formoptions: null,
    formvalue: null,
    id: '', // 新增时为空，后端会生成
    isLimited: false,
    multilineSeparatorInfo: column.multilineSeparatorInfo || '',
    props: null,
    refresh: false,
    requestSearch: null,
    requestUrl: null,
    required: true,
    searchType: column.searchType || 'input',
    showOverflow: true,
    validate: null,
    visible: column.visible !== false
  }))

  return selectionDetail ? [selectionDetail, ...columnDetails] : columnDetails
}

/**
 * 将列表选择模式转换为系统约定的特殊列配置。
 * 选择列只有 field 有业务含义，始终位于列表第一列且排序为 0。
 */
const createSelectionPageConfigDetail = (
  selectionMode: TableComponentConfig['selectionMode'],
  menu: MenuItem,
  parentMenu: MenuItem
): import('@pages/biz-tools/types').PageConfigDetail => ({
  columnExport: '0',
  dictCode: null,
  editView: null,
  editableInCreate: '0',
  editableInEdit: '0',
  entityFieldName: null,
  field: selectionMode === 'single' ? 'checkTyperadio' : 'checkTypecheckbox',
  title: '',
  fixed: null,
  formorder: '0',
  functionCode: menu.code,
  parentCode: parentMenu.code,
  search: null,
  type: '',
  visibleInEdit: null,
  visibleInLook: null,
  width: '',
  align: null,
  className: null,
  col: null,
  formControl: null,
  formon: null,
  formoptions: null,
  formvalue: null,
  id: '',
  isLimited: false,
  multilineSeparatorInfo: '',
  props: null,
  refresh: false,
  requestSearch: null,
  requestUrl: null,
  required: false,
  searchType: '',
  showOverflow: false,
  validate: null,
  visible: true
})
