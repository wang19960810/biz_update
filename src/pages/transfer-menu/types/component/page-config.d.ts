/**
 * 页面配置
 */
export interface PageConfig {
    apiUrl: string | null // 请求路径
    apiUrlRequestMapping: string // 请求方式
    configSource: string // 数据来源
    configSourceName: string // 数据来源名称
    functionCode: string // 功能编码
    functionName: string // 功能名称
    functionType: string // 功能类型 1： 列表 2： 表单
    parentCode: string // 菜单编码
    parentName?: string // 菜单名称
    remark: string // 备注
    systemOfConfigSource: string // 数据来源系统 如crm-dms
    id?: string // 页面配置id
}

/**
 * 页面配置详情字段
 */
export interface PageConfigDetail {
    columnExport: string // 是否导出 '0':不导出 '1':导出
    dictCode: null // 数据字典
    editView: null | string // 是否可以编辑
    editableInCreate: string // 新增时是否可以编辑
    editableInEdit: string // 编辑时是否可以编辑
    entityFieldName: null | string
    field: string // 字段名称
    title: string // 表头名称
    fixed: null |string // 固定方向
    formorder: null | string // 排序
    functionCode: string // 功能编码
    parentCode: string, // 菜单编码
    search: null | string // 是否查询
    type: string, // 组件类型
    visibleInEdit: null | string // 编辑时是否显示
    visibleInLook: null | string // 查看时是否显示
    width: string, // 组件宽度
    align: null | string
    className: null | string
    col: null | string
    formControl: null
    formon: null
    formoptions: null
    formvalue: null
    id: string,
    isLimited: boolean
    multilineSeparatorInfo: string
    props: null
    refresh: false
    requestSearch: null
    requestUrl: null
    required: true
    searchType: string
    showOverflow: true
    validate: null
    visible: true

}