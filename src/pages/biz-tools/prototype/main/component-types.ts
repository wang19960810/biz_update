/**
 * 列表列定义。
 *
 * label 用于页面展示，prop 用于绑定列表行数据，width 是可选的列宽。
 */
export interface TableColumnConfig {
  label: string
  prop: string
  width?: number
  minWidth?: number
  visible?: boolean
  clickView?: boolean
  columnExport?: boolean
  fixed?: '' | 'left' | 'right'
  search?: boolean
  statistic?: boolean
  searchType?: string
  multilineSeparatorInfo?: string
  dictCode?: string
  displayOrder?: number
}

/**
 * 列表组件的基础配置。
 *
 * 这份配置同时服务于画布预览和后续 render.json / 可复制代码生成。
 */
export interface TableComponentConfig {
  selectionMode: 'none' | 'single' | 'multiple'
  columns: TableColumnConfig[]
}

/**
 * 按钮基础配置。
 *
 * 这里的字段尽量贴近系统页面按钮定义，方便后续直接映射同步字段。
 */
export interface ButtonItemConfig {
  assignFunctionCode: string
  buttonCode: string
  buttonName: string
  buttonOrder: number
  buttonType: string
  name: string
  parentCode: string
  type: string | null
  visible: boolean
  apiUrl?: string | null
  ask?: string | null
  buttonId?: string
  buttonMethod?: string
  buttonOperationType?: string | null
  buttonTypeName?: string | null
  code?: string
  configCode?: string | null
  doCode?: string | null
  functionCode?: string
  iconCode?: string
  iconEffect?: string | null
  iconName?: string | null
  iconStyle?: string | null
  iconUrl?: string | null
  id?: string
  queryUrl?: string | null
}

/**
 * 按钮组件基础配置。
 */
export interface ButtonComponentConfig {
  buttons: ButtonItemConfig[]
}

/**
 * 自定义表头组件配置。
 */
export interface HeaderStatConfig {
  label: string
  value: string
  tone?: string
}

export interface HeaderComponentConfig {
  title: string
  description: string
  stats: HeaderStatConfig[]
}

/**
 * 当前画布支持的组件类型。
 */
export type CanvasComponentType = 'table' | 'button' | 'custom-header'

/**
 * 画布组件配置的联合类型。
 */
export type CanvasComponentConfig =
  | TableComponentConfig
  | ButtonComponentConfig
  | HeaderComponentConfig

/**
 * 组件面板提交给画布的创建数据。
 */
export interface ComponentCreatePayload {
  type: CanvasComponentType
  config: CanvasComponentConfig
}

/**
 * 本地数据库存储的组件数据，用于持久化画布组件和本地渲染。
 *
 * 这份数据比 PageConfig 更详细，包含画布配置、UI状态和扩展字段。
 */
export interface LocalComponentData {
  // 基础标识
  componentId: string
  menuId: string
  pageId: string
  componentType: CanvasComponentType
  componentName: string

  // 画布配置（序列化为 JSON）
  canvasConfig: CanvasComponentConfig | Record<string, unknown>

  // UI 状态
  sortIndex: number
  visible: boolean

  // 元数据
  createdAt: string
  updatedAt: string
}

/**
 * 列表组件扩展配置，用于生成 PageConfigDetail。
 */
export interface TableComponentExtendedConfig extends TableComponentConfig {
  // 列表级配置
  apiUrl?: string
  apiUrlRequestMapping?: string
  configSource?: string
  remark?: string

  // 列级扩展配置（未来可能需要）
  columnDetails?: Array<{
    field: string
    title: string
    width?: string
    fixed?: string
    search?: string
    editView?: string
    type?: string
  }>
}

/**
 * 画布中已创建的组件实例。
 *
 * 这个接口用于画布内存状态，创建时不带 ID，保存后会生成 componentId 并持久化。
 */
export interface CanvasComponent {
  id: string // 临时 ID，用于画布内 v-for key
  componentId?: string // 持久化后的数据库 ID
  type: CanvasComponentType
  name: string
  config: CanvasComponentConfig
  saved?: boolean // 是否已保存到数据库
}
