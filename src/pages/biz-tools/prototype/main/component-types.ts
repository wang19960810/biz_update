/**
 * 列表列定义。
 *
 * label 用于页面展示，prop 用于绑定列表行数据，width 是可选的列宽。
 */
export interface TableColumnConfig {
  label: string // 列展示名称，对应系统配置的 title。
  prop: string // 列绑定字段名，对应系统配置的 field/entityFieldName。
  width?: number // 固定列宽，可选。
  minWidth?: number // 列最小宽度，可选。
  visible?: boolean // 是否在列表中显示。
  clickView?: boolean // 点击列内容是否进入查看或编辑视图。
  columnExport?: boolean // 是否允许导出该列。
  fixed?: '' | 'left' | 'right' // 列固定方向。
  search?: boolean // 是否把该字段加入查询条件。
  statistic?: boolean // 是否参与统计展示。
  searchType?: string // 查询条件使用的组件类型。
  multilineSeparatorInfo?: string // 多值字段的分隔符配置。
  dictCode?: string // 绑定的数据字典编码。
  displayOrder?: number // 列在系统配置中的显示顺序。
}

/**
 * 列表组件的基础配置。
 *
 * 这份配置同时服务于画布预览和后续 render.json / 可复制代码生成。
 */
export interface TableComponentConfig {
  selectionMode: 'none' | 'single' | 'multiple' // 列表行选择模式。
  columns: TableColumnConfig[] // 列表的业务列配置。
}

/**
 * 按钮基础配置。
 *
 * 这里的字段尽量贴近系统页面按钮定义，方便后续直接映射同步字段。
 */
export interface ButtonItemConfig {
  assignFunctionCode: string // 被分配的功能编码。
  buttonCode: string // 按钮业务编码。
  buttonName: string // 按钮展示名称。
  buttonOrder: number // 按钮显示顺序。
  buttonType: string // 按钮样式类型。
  name: string // 按钮名称兼容字段。
  parentCode: string // 所属父级编码。
  type: string | null // 系统按钮类型。
  visible: boolean // 是否显示按钮。
  apiUrl?: string | null // 按钮请求地址。
  ask?: string | null // 执行前确认提示。
  buttonId?: string // 系统按钮 ID。
  buttonMethod?: string // 按钮触发方法。
  buttonOperationType?: string | null // 按钮操作类型。
  buttonTypeName?: string | null // 按钮类型名称。
  code?: string // 按钮编码兼容字段。
  configCode?: string | null // 按钮配置编码。
  doCode?: string | null // 按钮执行代码。
  functionCode?: string // 所属功能编码。
  iconCode?: string // 图标编码。
  iconEffect?: string | null // 图标效果。
  iconName?: string | null // 图标名称。
  iconStyle?: string | null // 图标样式。
  iconUrl?: string | null // 图标地址。
  id?: string // 系统按钮主键。
  queryUrl?: string | null // 查询请求地址。
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
  label: string // 统计项名称。
  value: string // 统计项展示值。
  tone?: string // 统计项视觉样式。
}

export interface HeaderComponentConfig {
  title: string // 表头主标题。
  description: string // 表头说明文本。
  stats: HeaderStatConfig[] // 表头统计项集合。
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
  type: CanvasComponentType // 要创建的组件类型。
  config: CanvasComponentConfig // 组件初始配置。
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
  id: string // 临时 ID，用于画布内 v-for key。
  componentId?: string // 持久化后的数据库 ID。
  type: CanvasComponentType // 画布组件类型。
  name: string // 画布中显示的组件名称。
  config: CanvasComponentConfig // 当前组件的完整配置。
  saved?: boolean // 是否已保存到本地数据库。
}
