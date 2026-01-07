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