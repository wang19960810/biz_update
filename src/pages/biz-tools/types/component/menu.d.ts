import type { PageConfig } from './page-config.d.ts'

/**
 * 菜单字段定义
 */
export type PageBuilderMenuType = 'page' | 'list' | 'form' | 'folder'

export interface MenuItem {
    // 系统菜单字段：同步测试环境时只发送这些字段。
    code: string // 菜单编码
    comment: string // 菜单名称
    parentCode: string // 父级菜单编码
    resource: string | null // 菜单路径
    icon: string | null // 菜单图标
    sortIndex: number | null // 排序值
    tstatus: number // 启禁用状态：1 启用，0 禁用
    competenceCode: string // 权限编码
    roleCodes: string[] // 角色编码集合
    type: string // 菜单类型
    viewItem: number // 是否页面项

    // PageBuilder 本地字段：只用于本地数据库、文件生成和页面编辑。
    id: string // PageBuilder 本地唯一主键
    fileName: string // 可复制代码内层文件夹名
    builderType: PageBuilderMenuType // PageBuilder 节点类型：页面、列表、表单或文件夹
    pageConfig?: PageConfig | null // 列表/表单对应的页面配置，页面和文件夹为空
    pageId?: string // 本地页面映射 ID，列表/表单通过它关联所属页面
    tag: string | null // 本地业务标签
    disable?: boolean // 是否禁用（新增数据不可选中标记）
    submitStatus?: 'draft' | 'submitted' // 同步状态：draft 未同步，submitted 已同步
    children?: MenuItem[] // 页面树子节点，不作为接口字段
}
