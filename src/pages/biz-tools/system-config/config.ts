/**
 * 系统配置单页面支持的视图标识。
 * home 页和 system-config 入口页共用这一套映射，避免菜单和组件切换逻辑分散。
 */
export type SystemConfigView =
  | 'menu-sync'
  | 'data-view'
  | 'page-layout'
  | 'dict-code'
  | 'page-button'

/**
 * 菜单关联同步模块内部的子视图。
 * 同一路由下通过 tab 参数区分“新增菜单”和“更新页面数据”。
 */
export type MenuSyncTab = 'add-menu' | 'page-data'

export type SystemConfigMenuItem = {
  key: string
  name: string
  icon: string
  view: SystemConfigView
  tab?: MenuSyncTab
  description: string
  implemented: boolean
}

export const defaultSystemConfigView: SystemConfigView = 'menu-sync'
export const defaultMenuSyncTab: MenuSyncTab = 'add-menu'

/**
 * 顶部入口菜单配置。
 * implemented=true 表示已经接入真实业务组件，否则先落到占位面板。
 */
export const systemConfigMenuList: SystemConfigMenuItem[] = [
  {
    key: "menu-sync",
    name: "菜单关联同步",
    icon: "/src/assets/images/add-menu.png",
    view: "menu-sync",
    tab: "add-menu",
    description: "处理测试环境新增菜单，并同步到正式环境。",
    implemented: true
  },
  {
    key: "data-view",
    name: "数据视图",
    icon: "/src/assets/images/update-data-view.png",
    view: "data-view",
    description: "数据视图能力暂未接入，当前先保留单页面入口映射。",
    implemented: false
  },
  {
    key: "page-layout",
    name: "页面配置",
    icon: "/src/assets/images/update-page-config.png",
    view: "page-layout",
    description: "页面配置能力暂未接入，当前先保留单页面入口映射。",
    implemented: false
  },
  {
    key: "dict-code",
    name: "数据字典",
    icon: "/src/assets/images/update-data-dictionary.png",
    view: "dict-code",
    description: "数据字典能力暂未接入，当前先保留单页面入口映射。",
    implemented: false
  },
  {
    key: "page-button",
    name: "页面按钮",
    icon: "/src/assets/images/update-button.png",
    view: "page-button",
    description: "页面按钮能力暂未接入，当前先保留单页面入口映射。",
    implemented: false
  }
]

/**
 * 将路由 query 中的 view 参数规范化。
 * 传入未知值时回退到默认视图，避免入口页出现空白。
 */
export const resolveSystemConfigView = (view: unknown): SystemConfigView => {
  const normalizedView = Array.isArray(view) ? view[0] : view

  return systemConfigMenuList.some(item => item.view === normalizedView)
    ? normalizedView as SystemConfigView
    : defaultSystemConfigView
}

/**
 * 将菜单关联同步模块内部的 tab 参数规范化。
 * 当前只支持“新增菜单”和“更新页面数据”两个子视图。
 */
export const resolveMenuSyncTab = (tab: unknown): MenuSyncTab => {
  const normalizedTab = Array.isArray(tab) ? tab[0] : tab

  return normalizedTab === 'page-data' ? 'page-data' : defaultMenuSyncTab
}

/**
 * 根据 view + tab 找到当前应该高亮的顶部菜单。
 * 这样首页入口、顶部菜单和组件渲染都由同一份映射驱动。
 */
export const resolveSystemConfigMenuItem = (
  view: unknown,
  tab: unknown
): SystemConfigMenuItem => {
  const normalizedView = resolveSystemConfigView(view)
  const normalizedTab = normalizedView === 'menu-sync' ? resolveMenuSyncTab(tab) : undefined

  return systemConfigMenuList.find(item => {
    return item.view === normalizedView && item.tab === normalizedTab
  }) || systemConfigMenuList.find(item => item.view === normalizedView) || systemConfigMenuList[0]
}
