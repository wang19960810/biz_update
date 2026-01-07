/**
 * 接口请求基本参数
 */
export interface RuleForm {
    testUrl: string, // 测试域名
    testJwt: string, // 测试Jwt
    prodUrl: string, // 正式域名
    prodJwt: string, // 正式Jwt
}

/**
 * 菜单字段定义
 */
export interface MenuItem {
    code: string // 菜单编码
    comment:string // 菜单名称
    parentCode: string // 父级菜单
    resource: string | null // 菜单路径
    icon: string | null // 菜单图标
    sortIndex: number | null // 排序
    tstatus: number // 启禁用状态  1 启用 0禁用
    competenceCode: string
    id: string
    roleCodes: string[]
    children?: MenuItem[]
    tag: string | null
    type: string
    viewItem: number
}

/**
 * 数据视图额外字段
 */
export interface ExternalField {
    fieldCnName: string // 关联描述
    fieldName: string // 字段名
    id: string
    interceptorCode: string // 关联字段名称
}

/**
 * 数据视图 系统参数
 */
export interface MateData {
    nullable: boolean // 是否可为空
    paramName: string // 字段名
    paramValue: string | null
    valueBindType: string // 数据来源
    valueType: string // 数据类型
}

/**
 * 数据视图 查询字段 -> 对应数据视图页面的 查询配置
 */
export interface Parameter {
    conditionName: string // 字段名
    defaultValueJson: string
    mainQuery: boolean
    multilineSeparatorInfo: string
    paramName: string // 查询字段名称
    required: boolean // 是否必填
    showOrder: number // 搜索栏排序
    targetAlias: string
    targetFieldName: string
    targetOpType:string
    targetTableName: string | null
    valueBindType:string
    valueType: string
}

/**
 * 数据视图配置字段
 */
export interface ViewOrder {
    defaultFieldName: boolean
    fieldComment: string // 字段名
    paramName: string // 字段
    performanceRisk: boolean
    showOrder: number // 搜索栏排序
    targetAlias: string
    targetFieldName: string
    targetTableNames: string | null
}

/**
 * 数据视图 配置
 */
export interface DataView {
    databaseViewExternalFields: ExternalField[],
    databaseViewMateDataConditions: MateData[],
    databaseViewOrders: ViewOrder[],
    databaseViewParameterConditions: Parameter[],
    datasouceCode: string
    id: string
    name: string
    registerCode: string
    souceType: string
    tenantCode: string
}

/**
 * 数据视图所有字段
 */
export interface DataViewInfo {
    code: string
    id: string
    name: string
    pageable: boolean
    sourceType:string
    subSystem: string
    tenantCode: string
    view: DataView
}

