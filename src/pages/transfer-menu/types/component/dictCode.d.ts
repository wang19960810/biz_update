export interface DictCodeOptions {
    path: Readonly<string> | string;
    children?: DictCodeOptions[]
    dictCode: string, // 数据字典值
    dictDesc: null | string // 数据字典 备注
    dictSort: number // 排序
    dictTypeCode: string // 所属数据字典编码
    dictValue: string // 数据字典 描述
    ext1: string
    ext2: string
    id?: string // id
    parentDictCode: string // 父级 数据字典值
}

export interface DictCode {
    dictTypeCode: string
    dictTypeDesc: null | string
    dictTypeModule: string
    dictTypeModuleName: null
    dictTypeName: null | string
    enableStatus: string
    remark: null | string
    tenantCode: string
    createAccount?: string
    createName?: string
    createTime?: string
    delFlag?: string
    id?: string
    modifyAccount?: string
    modifyName?: string
    modifyTime?: string

}