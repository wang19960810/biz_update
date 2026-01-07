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
    code: string // 数据视图编码
    id: string // 数据视图id
    name: string // 数据视图名称
    pageable: boolean
    sourceType:string
    subSystem: string // 数据来源系统
    tenantCode: string
    view: DataView
}
