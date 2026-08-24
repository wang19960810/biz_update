import instance from '@src/server/index.ts'
import { useServeStore } from '@src/store/serveStoreState.ts'

import type { MenuItem, PageBuilderMenuType, PageConfig } from '@pages/biz-tools/types'
import type { LocalComponentData } from './component-types'

/**
 * 发送给系统菜单接口的字段。
 *
 * PageBuilder 专用的 fileName、submitStatus 等字段不会进入这个对象。
 */
export interface PageBuilderSystemMenuPayload {
  code: string
  comment: string
  parentCode: string
  resource: string | null
  icon: string | null
  sortIndex: number | null
  tstatus: number
  competenceCode: string
  roleCodes: string[]
  type: string
  viewItem: number
}

/**
 * 测试环境菜单提交字段。
 *
 * id 只在测试环境已存在菜单时使用，新增菜单不会发送本地 PageBuilder ID。
 */
export interface PageBuilderTestMenuPayload extends PageBuilderSystemMenuPayload {
  id?: string | number
}

/**
 * 只供 PageBuilder 本地 Node 服务使用的菜单字段。
 *
 * 这些字段用于本地数据库、文件生成和树状态，不是系统菜单接口参数。
 */
export interface PageBuilderLocalMenuPayload {
  id: string
  code: string
  fileName: string
  builderType: PageBuilderMenuType
  pageConfig: PageConfig | null
  tag: string | null
  disable: boolean
  submitStatus: 'draft' | 'submitted'
}

/**
 * PageBuilder 本地同步请求。
 *
 * systemMenus 与 localState 分开，本地 Node 服务只使用这两部分生成数据库和代码。
 */
export interface PageBuilderSyncPayload {
  systemMenus: PageBuilderSystemMenuPayload[]
  localState: {
    menus: PageBuilderLocalMenuPayload[]
    checkedMenuIds: string[]
  }
}

/**
 * 本地同步状态更新请求。
 *
 * 该请求只修改 database.json 的 checked 和 submitStatus，不触发代码生成。
 */
export interface PageBuilderLocalStatusPayload {
  syncedMenuIds: string[]
  checkedMenuIds: string[]
}

/**
 * 提取系统菜单字段，避免把 PageBuilder 本地字段传给系统接口。
 */
export const snapshotSystemMenuList = (menus: MenuItem[]): PageBuilderSystemMenuPayload[] => {
  return menus.map(item => ({
    code: item.code,
    comment: item.comment,
    parentCode: item.parentCode,
    resource: item.resource,
    icon: item.icon,
    sortIndex: item.sortIndex,
    tstatus: item.tstatus,
    competenceCode: item.competenceCode,
    roleCodes: [...item.roleCodes],
    type: item.type,
    viewItem: item.viewItem
  }))
}

/**
 * 提取 PageBuilder 本地字段，供本地 Node 服务写入 database.json 和生成文件。
 */
export const snapshotLocalMenuList = (menus: MenuItem[]): PageBuilderLocalMenuPayload[] => {
  return menus.map(item => ({
    id: item.id,
    code: item.code,
    fileName: item.fileName,
    builderType: item.builderType,
    pageConfig: item.pageConfig ? { ...item.pageConfig } : null,
    tag: item.tag,
    disable: Boolean(item.disable),
    submitStatus: item.submitStatus === 'submitted' ? 'submitted' : 'draft'
  }))
}

export const syncPageBuilderState = (payload: PageBuilderSyncPayload) => {
  return instance.post('/api/page-builder/sync', payload)
}

/**
 * 只更新本地菜单同步状态，不重复执行本地代码生成。
 */
export const updatePageBuilderLocalStatus = (payload: PageBuilderLocalStatusPayload) => {
  return instance.post('/api/page-builder/local-status', payload)
}

export const loadPageBuilderDatabase = () => {
  return instance.get('/api/page-builder/database')
}

/**
 * 根据页面 ID 读取页面级渲染数据。
 */
export const loadPageBuilderPageData = (pageId: string) => {
  return instance.get(`/api/page-builder/page-data/${encodeURIComponent(pageId)}`)
}

/**
 * 保存当前页面某个实体的本地画布组件。
 *
 * menuId 用于局部替换，服务端会保留同一页面其它列表、表单和组件的数据。
 */
export const savePageBuilderPageData = (
  pageId: string,
  payload: {
    menuId: string
    components: LocalComponentData[]
  }
) => {
  return instance.post(`/api/page-builder/page-data/${encodeURIComponent(pageId)}`, payload)
}

/**
 * 导出当前菜单及以下菜单的可复制代码 ZIP。
 */
export const exportPageBuilderCode = (menuId: string) => {
  return instance.post('/api/page-builder/export', { menuId }, {
    responseType: 'blob'
  })
}

const MENU_API_PATH = '/crm-mdm/v1/competences/competences'
const MENU_QUERY_PATH = `${MENU_API_PATH}/findByViewItemAndCurrentUser?viewItem=true&codeOrComment=`

/**
 * 将测试环境菜单树展开，方便按菜单编码判断远端是否已有记录。
 */
const flattenRemoteMenuList = (menus: unknown, result: PageBuilderTestMenuPayload[] = []) => {
  if (!Array.isArray(menus)) {
    return result
  }

  for (const menu of menus) {
    if (!menu || typeof menu !== 'object') {
      continue
    }

    const current = menu as PageBuilderTestMenuPayload & { children?: unknown[] }
    result.push(current)
    flattenRemoteMenuList(current.children, result)
  }

  return result
}

/**
 * 判断菜单接口返回的业务结果是否失败。
 */
const assertMenuRequestSuccess = (payload: any, menu: PageBuilderSystemMenuPayload) => {
  if (payload?.success === false) {
    throw new Error(payload.message || `菜单 ${menu.comment} 同步失败`)
  }

  if (
    payload?.code !== undefined
    && Number(payload.code) !== 0
    && payload?.success !== true
  ) {
    throw new Error(payload.message || `菜单 ${menu.comment} 同步失败`)
  }
}

/**
 * 将勾选菜单按父子顺序同步到测试环境。
 *
 * 同步前先查询测试环境，用菜单编码区分 POST 新增和 PATCH 更新；
 * console.info 会输出不含 JWT 的最终请求体，便于核对提交字段。
 */
export const syncPageBuilderMenusToTest = async (menus: MenuItem[]) => {
  const serveStore = useServeStore()
  const { url, Jwt } = serveStore.getServeDetails('test')
  const headers = { Jwt }
  const testMenuResponse = await instance.get(`${url}${MENU_QUERY_PATH}`, { headers })
  const testMenus = flattenRemoteMenuList(testMenuResponse.data?.data)
  const testMenuMap = new Map(
    testMenus
      .filter(menu => String(menu.code || '').trim())
      .map(menu => [String(menu.code).trim(), menu])
  )
  const results: Array<{
    menuId: string
    code: string
    method: 'post' | 'patch'
    payload: PageBuilderTestMenuPayload
  }> = []

  for (const menu of menus) {
    const systemMenu = snapshotSystemMenuList([menu])[0]
    const remoteMenu = testMenuMap.get(menu.code.trim())
    const method = remoteMenu?.id ? 'patch' : 'post'
    const payload: PageBuilderTestMenuPayload = {
      ...systemMenu,
      ...(remoteMenu?.id ? { id: remoteMenu.id } : {})
    }

    console.info(`[PageBuilder][测试环境] ${method === 'post' ? '新增' : '更新'}菜单提交参数`, payload)
    const response = await instance[method](`${url}${MENU_API_PATH}`, payload, { headers })
    assertMenuRequestSuccess(response.data, systemMenu)

    results.push({
      menuId: menu.id,
      code: menu.code,
      method,
      payload
    })

    // 当前批次后续子菜单按 parentCode 关联，编码索引需要保留本次已成功菜单。
    testMenuMap.set(menu.code.trim(), {
      ...payload,
      id: response.data?.data?.id || remoteMenu?.id
    })
  }

  return results
}
