import { computed, ref } from 'vue'

import type { MenuItem, PageBuilderMenuType, PageConfig } from '@pages/biz-tools/types'
import { parentFirstSort } from '@src/units/tool.ts'
import { loadPageBuilderDatabase } from './page-builder-api'

// 生成本地唯一 ID，优先使用浏览器原生 UUID。
const createUid = (prefix = 'menu') => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

// 时间补零，避免日期拼接时出现单数字。
const pad2 = (value: number) => String(value).padStart(2, '0')

// 菜单编码规则：CRM + 当前日期 + 时间戳后 6 位。
export const generateMenuCode = () => {
  const now = new Date()
  const datePart = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`
  const timeSuffix = String(Date.now()).slice(-6)

  return `CRM${datePart}${timeSuffix}`
}

// 文件名称规则：仅保留英文、数字和短横线，方便直接作为目录名。
export const normalizeMenuFileName = (value: string) => {
  const text = String(value ?? '').trim().toLowerCase()
  const normalized = text
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized
}

// 校验 PageBuilder 菜单类型，类型必须来自当前编辑器定义。
export const normalizeBuilderType = (value: unknown): PageBuilderMenuType => {
  if (value === 'page' || value === 'list' || value === 'form' || value === 'folder') {
    return value
  }

  throw new Error(`PageBuilder 菜单类型无效：${String(value)}`)
}

// 根据节点类型补全页面配置，页面和文件夹不保存页面配置。
export const createPageConfig = (
  builderType: PageBuilderMenuType,
  value?: Partial<PageConfig> | null,
  menu?: Pick<MenuItem, 'code' | 'comment' | 'parentCode'>
): PageConfig | null => {
  if (builderType !== 'list' && builderType !== 'form') {
    return null
  }

  const source = value || {}
  const code = menu?.code || ''
  const comment = menu?.comment || ''
  const parentCode = menu?.parentCode || ''

  return {
    apiUrl: source.apiUrl ?? null,
    apiUrlRequestMapping: String(source.apiUrlRequestMapping ?? ''),
    configSource: String(source.configSource ?? ''),
    configSourceName: String(source.configSourceName ?? ''),
    functionCode: String(source.functionCode ?? code),
    functionName: String(source.functionName ?? comment),
    functionType: builderType === 'form' ? '2' : '1',
    parentCode,
    parentName: comment,
    remark: String(source.remark ?? ''),
    systemOfConfigSource: String(source.systemOfConfigSource ?? ''),
    ...(source.id ? { id: String(source.id) } : {}),
    // 只有明确标记为 true 才是主列表，表单不需要这个字段。
    isPrimaryList: builderType === 'list' ? source.isPrimaryList === true : undefined
  }
}

// 深拷贝菜单列表，避免引用污染。
const cloneMenuList = (list: MenuItem[]) => {
  return JSON.parse(JSON.stringify(list)) as MenuItem[]
}

// 统一补全菜单字段，保证树数据结构稳定。
const createMenuItem = (item: Partial<MenuItem> & Pick<MenuItem, 'code' | 'comment'>): MenuItem => {
  const fallbackFileName = normalizeMenuFileName(item.fileName || item.code || item.comment || 'menu')
  const builderType = normalizeBuilderType(item.builderType)

  return {
    code: item.code,
    comment: item.comment,
    fileName: fallbackFileName,
    parentCode: item.parentCode ?? '',
    resource: item.resource ?? '',
    icon: item.icon ?? null,
    sortIndex: item.sortIndex ?? 0,
    tstatus: item.tstatus ?? 1,
    competenceCode: item.competenceCode || item.code,
    id: item.id ?? createUid('menu'),
    roleCodes: item.roleCodes ? [...item.roleCodes] : [],
    children: item.children ? cloneMenuList(item.children) : [],
    tag: item.tag ?? null,
    builderType,
    pageConfig: createPageConfig(builderType, item.pageConfig, {
      code: item.code,
      comment: item.comment,
      parentCode: item.parentCode ?? ''
    }),
    type: item.type ?? 'default',
    viewItem: item.viewItem ?? 1,
    disable: item.disable ?? false,
    submitStatus: item.submitStatus ?? 'draft'
  }
}

// 归一化同一页面下的主列表标记，确保每个页面最多只有一个主列表。
const normalizePrimaryListFlags = (list: MenuItem[]) => {
  const primaryByParent = new Set<string>()

  return list.map(item => {
    if (item.builderType !== 'list') {
      return item
    }

    const parentCode = item.parentCode || ''
    const requestedPrimary = item.pageConfig?.isPrimaryList === true
    const isPrimary = requestedPrimary && !primaryByParent.has(parentCode)

    if (isPrimary) {
      primaryByParent.add(parentCode)
    }

    if (item.pageConfig?.isPrimaryList === isPrimary) {
      return item
    }

    return createMenuItem({
      ...item,
      pageConfig: createPageConfig('list', {
        ...item.pageConfig,
        isPrimaryList: isPrimary
      }, {
        code: item.code,
        comment: item.comment,
        parentCode: item.parentCode
      }),
      children: []
    })
  })
}

// 页面原型的初始菜单结构，首次进入或重置时使用。
const seedMenuList: MenuItem[] = [
  createMenuItem({
    code: 'page-builder',
    comment: 'PageBuilder',
    builderType: 'page',
    parentCode: '',
    resource: '/biz-tools/prototype/main',
    icon: 'Grid',
    sortIndex: 1,
    competenceCode: 'page-builder',
    tag: 'builder',
    submitStatus: 'draft'
  }),
  createMenuItem({
    code: 'page-builder-tree',
    comment: '文件树',
    builderType: 'page',
    parentCode: 'page-builder',
    resource: '/biz-tools/prototype/main#tree',
    icon: 'FolderOpened',
    sortIndex: 1,
    competenceCode: 'page-builder-tree',
    tag: 'tree',
    submitStatus: 'draft'
  }),
  createMenuItem({
    code: 'page-builder-components',
    comment: '组件模块',
    builderType: 'page',
    parentCode: 'page-builder',
    resource: '/biz-tools/prototype/main#components',
    icon: 'Grid',
    sortIndex: 2,
    competenceCode: 'page-builder-components',
    tag: 'component',
    submitStatus: 'draft'
  }),
  createMenuItem({
    code: 'page-builder-canvas',
    comment: '页面渲染层',
    builderType: 'page',
    parentCode: 'page-builder',
    resource: '/biz-tools/prototype/main#canvas',
    icon: 'Monitor',
    sortIndex: 3,
    competenceCode: 'page-builder-canvas',
    tag: 'canvas',
    submitStatus: 'draft'
  }),
  createMenuItem({
    code: 'page-builder-property',
    comment: '属性设置',
    builderType: 'page',
    parentCode: 'page-builder',
    resource: '/biz-tools/prototype/main#property',
    icon: 'Setting',
    sortIndex: 4,
    competenceCode: 'page-builder-property',
    tag: 'property',
    submitStatus: 'draft'
  })
]

/**
 * 本地数据库中的菜单记录。
 *
 * 数据库同时保存系统字段和 PageBuilder 字段，但前端恢复时会重新整理成 MenuItem。
 */
interface PageBuilderDatabaseMenuRecord {
    menuId?: string
    menuCode?: string
    menuName?: string
    fileName?: string
    pageId?: string
    parentMenuCode?: string
  resource?: string | null
  icon?: string | null
  sortIndex?: number | null
  tstatus?: number
  competenceCode?: string
  roleCodes?: string[]
  tag?: string | null
  type?: string
  viewItem?: number
  disable?: boolean
  builderType?: PageBuilderMenuType
  pageConfig?: PageConfig | null
  submitStatus?: 'draft' | 'submitted'
  checked?: boolean
}

/**
 * 将 database.json 中的菜单记录恢复为页面树使用的菜单对象。
 */
const normalizeDatabaseMenuList = (records: unknown): MenuItem[] => {
  if (!Array.isArray(records)) {
    return []
  }

  const rawRecords = records as PageBuilderDatabaseMenuRecord[]
  return rawRecords
    .map(item => {
      const code = String(item.menuCode ?? '').trim()

      if (!code) {
        return null
      }

      return createMenuItem({
        id: item.menuId || createUid('menu'),
        code,
        comment: String(item.menuName ?? '').trim(),
        fileName: item.fileName || code,
        pageId: item.pageId || '',
        parentCode: String(item.parentMenuCode ?? ''),
        resource: item.resource ?? '',
        icon: item.icon ?? null,
        sortIndex: item.sortIndex ?? 0,
        tstatus: item.tstatus ?? 1,
        competenceCode: item.competenceCode || code,
        roleCodes: item.roleCodes || [],
        tag: item.tag ?? null,
        builderType: item.builderType,
        pageConfig: item.pageConfig ?? null,
        type: item.type || 'default',
        viewItem: item.viewItem ?? 1,
        disable: item.disable ?? false,
        submitStatus: item.submitStatus === 'submitted' ? 'submitted' : 'draft'
      })
    })
    .filter((item): item is MenuItem => Boolean(item))
}

/**
 * 从本地 Node 服务加载菜单树；数据库为空时使用原型默认节点。
 */
const loadDatabaseMenuList = async () => {
  const response = await loadPageBuilderDatabase()
  const records = response.data?.data?.tables?.menus
  const menus = normalizeDatabaseMenuList(records)
  const rawRecords = Array.isArray(records) ? records as PageBuilderDatabaseMenuRecord[] : []
  const checkedMenuIds = rawRecords
    .filter(item => item.checked && item.menuId)
    .map(item => String(item.menuId))

  return {
    menus: menus.length ? menus : cloneMenuList(seedMenuList),
    checkedMenuIds: menus.length ? checkedMenuIds : []
  }
}

// 同级菜单按排序值优先，再按名称兜底排序。
const sortByIndex = (a: MenuItem, b: MenuItem) => {
  const sortA = a.sortIndex ?? 0
  const sortB = b.sortIndex ?? 0

  if (sortA !== sortB) {
    return sortA - sortB
  }

  return a.comment.localeCompare(b.comment, 'zh-Hans-CN')
}

// 把扁平菜单列表组装成树。
const buildMenuTree = (flatList: MenuItem[]): MenuItem[] => {
  const nodeMap = new Map<string, MenuItem>()
  const codeMap = new Map<string, MenuItem>()

  flatList.forEach(item => {
    const node = createMenuItem({
      ...item,
      children: []
    })

    nodeMap.set(node.id, node)
    codeMap.set(node.code, node)
  })

  const rootNodes: MenuItem[] = []

  flatList.forEach(item => {
    const currentNode = nodeMap.get(item.id)

    if (!currentNode) {
      return
    }

    const parentNode = item.parentCode ? codeMap.get(item.parentCode) : undefined

    if (parentNode && parentNode.id !== currentNode.id) {
      parentNode.children = parentNode.children || []
      parentNode.children.push(currentNode)
      return
    }

    rootNodes.push(currentNode)
  })

  const sortTree = (nodes: MenuItem[]) => {
    nodes.sort(sortByIndex)
    nodes.forEach(node => {
      if (node.children && node.children.length) {
        sortTree(node.children)
      } else {
        node.children = []
      }
    })
  }

  sortTree(rootNodes)
  return rootNodes
}

// 关键字过滤，保留命中的节点和其祖先/子树。
const filterTree = (nodes: MenuItem[], keyword: string): MenuItem[] => {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return nodes
  }

  const matchesNode = (node: MenuItem) => {
    return [node.comment, node.code, node.resource, node.competenceCode, node.tag]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(normalizedKeyword))
  }

  return nodes.reduce<MenuItem[]>((result, node) => {
    const children = filterTree(node.children || [], normalizedKeyword)

    if (matchesNode(node) || children.length) {
      result.push({
        ...node,
        children
      })
    }

    return result
  }, [])
}

// 收集某个节点下面的所有子孙编码，用于删除和联动校验。
export const collectSubtreeCodes = (flatList: MenuItem[], code: string): string[] => {
  const directChildren = flatList
    .filter(item => item.parentCode === code)
    .map(item => item.code)

  return directChildren.flatMap(childCode => [childCode, ...collectSubtreeCodes(flatList, childCode)])
}

// 找到同级下一个排序值。
const findNextSortIndex = (flatList: MenuItem[], parentCode: string) => {
  const siblingSortIndexes = flatList
    .filter(item => item.parentCode === parentCode)
    .map(item => item.sortIndex ?? 0)

  return siblingSortIndexes.length ? Math.max(...siblingSortIndexes) + 1 : 1
}

// 按 ID 查找菜单。
const findMenuItem = (flatList: MenuItem[], id: string) => {
  return flatList.find(item => item.id === id) || null
}

// 新增/编辑弹窗的草稿默认值。
const createDraftMenuItem = (parentCode = ''): MenuItem => {
  const draft = createMenuItem({
    code: '',
    comment: '',
    fileName: '',
    parentCode,
    resource: '',
    icon: null,
    sortIndex: 0,
    tstatus: 1,
    competenceCode: '',
    roleCodes: [],
    tag: null,
    builderType: 'page',
    pageConfig: null,
    type: 'default',
    viewItem: 1,
    disable: false,
    submitStatus: 'draft'
  })

  return {
    ...draft,
    fileName: ''
  }
}

export const usePageBuilderMenuTree = () => {
  // 主菜单树数据，最终持久化到本地 Node 服务维护的 database.json。
  const flatMenuList = ref<MenuItem[]>(cloneMenuList(seedMenuList))
  // 搜索关键字。
  const keyword = ref('')
  // 同步场景下勾选的菜单 ID 列表，仅保留在当前页面内存中并随本地同步请求保存。
  const checkedMenuIds = ref<string[]>([])
  // 已同步菜单 ID 列表，由 database.json 中的 submitStatus 恢复。
  const syncedMenuIds = ref<string[]>([])
  // 当前选中的节点 ID。
  const selectedId = ref(flatMenuList.value[0]?.id || '')

  // 当前选中的菜单对象。
  const selectedMenu = computed(() => {
    return findMenuItem(flatMenuList.value, selectedId.value)
  })

  // 根据勾选 ID 反查出待同步菜单。
  const checkedMenuList = computed(() => {
    return flatMenuList.value.filter(item => checkedMenuIds.value.includes(item.id))
  })

  // 同步时按父子顺序整理，确保先父后子提交。
  const checkedMenuListForSync = computed(() => {
    return parentFirstSort(checkedMenuList.value)
  })

  // 判断某个菜单是否已同步。
  const isMenuSynced = (id: string) => {
    return syncedMenuIds.value.includes(id)
  }

  // 根据关键字生成可渲染的树结构。
  const treeMenuList = computed(() => {
    return filterTree(buildMenuTree(flatMenuList.value), keyword.value)
  })

  // 从本地数据库重新加载菜单，并修正选中项、勾选项和已同步状态。
  const loadFromDatabase = async () => {
    const result = await loadDatabaseMenuList()
    flatMenuList.value = normalizePrimaryListFlags(result.menus)
    checkedMenuIds.value = result.checkedMenuIds
    syncedMenuIds.value = result.menus
      .filter(item => item.submitStatus === 'submitted')
      .map(item => item.id)

    if (!flatMenuList.value.some(item => item.id === selectedId.value)) {
      selectedId.value = flatMenuList.value[0]?.id || ''
    }

    return result
  }

  // 重置回默认种子数据。
  const reset = () => {
    flatMenuList.value = cloneMenuList(seedMenuList)
    selectedId.value = flatMenuList.value[0]?.id || ''
    checkedMenuIds.value = []
    syncedMenuIds.value = []
  }

  // 切换当前节点选中态。
  const selectMenu = (id: string) => {
    selectedId.value = id
  }

  // 复制一份草稿数据，供编辑弹窗使用。
  const getDraftById = (id: string) => {
    const current = findMenuItem(flatMenuList.value, id)

    if (!current) {
      return null
    }

    return createMenuItem({
      ...current,
      children: [],
      roleCodes: [...current.roleCodes]
    })
  }

  // 新增菜单时，自动补齐编码和默认排序。
  const addMenu = (draft: MenuItem) => {
    const code = draft.code.trim() || generateMenuCode()

    const nextItem = createMenuItem({
      ...draft,
      code,
      comment: draft.comment.trim(),
      fileName: normalizeMenuFileName(draft.fileName.trim() || code),
      competenceCode: draft.competenceCode.trim() || code,
      sortIndex: draft.sortIndex ?? findNextSortIndex(flatMenuList.value, draft.parentCode),
      children: [],
      submitStatus: draft.submitStatus ?? 'draft'
    })

    flatMenuList.value = normalizePrimaryListFlags([...flatMenuList.value, nextItem])
    // 新增节点默认不加入同步勾选，是否同步必须由用户单独勾选复选框决定。
    selectedId.value = nextItem.id
    return nextItem
  }

  // 编辑菜单时更新自身，并同步子节点父编码。
  const updateMenu = (originalId: string, draft: MenuItem) => {
    const original = findMenuItem(flatMenuList.value, originalId)

    if (!original) {
      return null
    }

    const nextItem = createMenuItem({
      ...draft,
      id: original.id,
      code: draft.code.trim(),
      comment: draft.comment.trim(),
      fileName: normalizeMenuFileName(draft.fileName.trim() || draft.code.trim() || original.fileName),
      competenceCode: draft.competenceCode.trim() || draft.code.trim(),
      children: [],
      submitStatus: original.submitStatus || draft.submitStatus || 'draft'
    })

    const nextList = flatMenuList.value.map(item => {
      if (item.id === original.id) {
        return nextItem
      }

      if (draft.code.trim() !== original.code && item.parentCode === original.code) {
        return {
          ...item,
          parentCode: nextItem.code
        }
      }

      return item
    })

    flatMenuList.value = normalizePrimaryListFlags(nextList)
    selectedId.value = nextItem.id
    return nextItem
  }

  // 将当前列表设为所属页面的主列表，并取消同级其它列表的主列表标记。
  const setPrimaryList = (id: string) => {
    const current = findMenuItem(flatMenuList.value, id)

    if (!current || current.builderType !== 'list') {
      return null
    }

    const nextList = flatMenuList.value.map(item => {
      if (item.builderType !== 'list' || item.parentCode !== current.parentCode) {
        return item
      }

      const pageConfig = createPageConfig('list', {
        ...item.pageConfig,
        isPrimaryList: item.id === current.id
      }, {
        code: item.code,
        comment: item.comment,
        parentCode: item.parentCode
      })

      return createMenuItem({
        ...item,
        pageConfig,
        children: []
      })
    })

    flatMenuList.value = nextList
    selectedId.value = current.id
    return findMenuItem(nextList, current.id)
  }

  // 删除节点时，级联删除所有子孙节点。
  const deleteMenu = (id: string) => {
    const current = findMenuItem(flatMenuList.value, id)

    if (!current) {
      return false
    }

    const removedCodes = new Set([current.code, ...collectSubtreeCodes(flatMenuList.value, current.code)])
    flatMenuList.value = flatMenuList.value.filter(item => !removedCodes.has(item.code))
    checkedMenuIds.value = checkedMenuIds.value.filter(itemId => {
      const node = findMenuItem(flatMenuList.value, itemId)
      return Boolean(node)
    })
    syncedMenuIds.value = syncedMenuIds.value.filter(itemId => {
      const node = findMenuItem(flatMenuList.value, itemId)
      return Boolean(node)
    })
    selectedId.value = flatMenuList.value[0]?.id || ''
    return true
  }

  // 标记一批菜单已经同步成功。
  const markMenusSynced = (ids: string[]) => {
    const nextIds = Array.from(new Set([
      ...syncedMenuIds.value,
      ...ids.filter(Boolean)
    ]))

    syncedMenuIds.value = nextIds
    flatMenuList.value = flatMenuList.value.map(item => (
      nextIds.includes(item.id)
        ? { ...item, submitStatus: 'submitted' }
        : item
    ))
  }

  // 直接设置勾选菜单 ID 列表。
  const setCheckedMenuIds = (ids: string[]) => {
    checkedMenuIds.value = Array.from(new Set(ids))
  }

  return {
    keyword,
    selectedId,
    selectedMenu,
    checkedMenuIds,
    checkedMenuList,
    checkedMenuListForSync,
    treeMenuList,
    flatMenuList,
    createDraftMenuItem,
    findNextSortIndex,
    getDraftById,
    selectMenu,
    addMenu,
    updateMenu,
    setPrimaryList,
    deleteMenu,
    setCheckedMenuIds,
    markMenusSynced,
    isMenuSynced,
    loadFromDatabase,
    reload: loadFromDatabase,
    reset,
  }
}

export type PageBuilderMenuTreeStore = ReturnType<typeof usePageBuilderMenuTree>
