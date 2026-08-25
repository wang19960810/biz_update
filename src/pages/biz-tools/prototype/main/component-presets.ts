import type { Component } from 'vue'
import { Document, Operation, Tickets } from '@element-plus/icons-vue'

import type {
  ButtonComponentConfig,
  CanvasComponentType,
  HeaderComponentConfig,
  TableColumnConfig,
  TableComponentConfig
} from './component-types'

export interface ComponentPaletteItem {
  type: CanvasComponentType
  label: string
  icon: Component
  availableFor: Array<'list' | 'form'>
}

/**
 * 组件库入口卡片。
 *
 * 这里统一管理图标、名称和默认配置，避免画布和属性面板分别维护同一份预设。
 */
export const componentPaletteItems: ComponentPaletteItem[] = [
  { type: 'table', label: '列表', icon: Document, availableFor: ['list', 'form'] },
  { type: 'button', label: '按钮', icon: Operation, availableFor: ['list', 'form'] },
  { type: 'custom-header', label: '自定义表头', icon: Tickets, availableFor: ['list', 'form'] }
]

/**
 * 新建列表组件时的默认配置。
 */
export const createDefaultTableColumnConfig = (index = 1): TableColumnConfig => {
  return {
    label: `列${index}`,
    prop: `field${index}`,
    visible: true,
    clickView: false,
    columnExport: true,
    fixed: '',
    search: true,
    statistic: false,
    searchType: 'input',
    multilineSeparatorInfo: '',
    dictCode: '',
    displayOrder: index
  }
}

/**
 * 将可能来自旧数据的列配置补全成当前版本结构。
 */
export const normalizeTableColumnConfig = (
  column: Partial<TableColumnConfig> | null | undefined,
  index = 1
): TableColumnConfig => {
  return {
    ...createDefaultTableColumnConfig(index),
    ...column
  }
}

/**
 * 新建列表组件时的默认配置。
 */
export const createDefaultTableConfig = (): TableComponentConfig => {
  return {
    selectionMode: 'none',
    columns: [
      normalizeTableColumnConfig(null, 1),
      normalizeTableColumnConfig(null, 2)
    ]
  }
}

/**
 * 新建按钮组件时的默认配置。
 *
 * 默认按钮只是占位，后续在右侧属性面板里再改成真实按钮字段。
 */
export const createDefaultButtonConfig = (): ButtonComponentConfig => {
  return {
    buttons: [
      {
        assignFunctionCode: '',
        buttonCode: 'export',
        buttonName: '导出',
        buttonOrder: 1,
        buttonType: 'primary',
        name: '导出',
        parentCode: '',
        type: 'button',
        visible: true,
        buttonMethod: 'click',
        buttonOperationType: 'export',
        buttonTypeName: '基础按钮',
        iconName: 'Download',
        queryUrl: '',
        apiUrl: ''
      },
      {
        assignFunctionCode: '',
        buttonCode: 'create',
        buttonName: '新增',
        buttonOrder: 2,
        buttonType: 'default',
        name: '新增',
        parentCode: '',
        type: 'button',
        visible: true,
        buttonMethod: 'click',
        buttonOperationType: 'create',
        buttonTypeName: '基础按钮',
        iconName: 'Plus',
        queryUrl: '',
        apiUrl: ''
      }
    ]
  }
}

/**
 * 新建自定义表头组件时的默认配置。
 */
export const createDefaultHeaderConfig = (): HeaderComponentConfig => {
  return {
    title: '页面标题',
    description: '这里是自定义表头说明',
    stats: [
      { label: '当前结果', value: '0' },
      { label: '总共条数', value: '0' }
    ]
  }
}

/**
 * 根据组件类型返回默认配置。
 */
export const createDefaultComponentConfig = (type: CanvasComponentType) => {
  if (type === 'button') {
    return createDefaultButtonConfig()
  }

  if (type === 'custom-header') {
    return createDefaultHeaderConfig()
  }

  return createDefaultTableConfig()
}

/**
 * 根据组件类型返回默认名称。
 */
export const createDefaultComponentName = (type: CanvasComponentType) => {
  if (type === 'button') {
    return '按钮组件'
  }

  if (type === 'custom-header') {
    return '自定义表头'
  }

  return '列表组件'
}

/**
 * 根据组件类型返回中文标签。
 */
export const getComponentTypeLabel = (type: CanvasComponentType) => {
  if (type === 'button') {
    return '按钮'
  }

  if (type === 'custom-header') {
    return '自定义表头'
  }

  return '列表'
}
