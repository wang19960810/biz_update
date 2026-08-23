// 校验 PageBuilder 菜单类型，类型必须来自当前编辑器定义。
export const normalizeBuilderType = value => {
  if (value === 'page' || value === 'list' || value === 'form' || value === 'folder') {
    return value
  }

  throw new Error(`PageBuilder 菜单类型无效：${String(value)}`)
}

// 规范化列表和表单使用的本地页面配置。
export const normalizePageConfig = (builderType, value, menu) => {
  if (builderType !== 'list' && builderType !== 'form') {
    return null
  }

  const source = value && typeof value === 'object' ? value : {}

  return {
    apiUrl: source.apiUrl == null ? null : String(source.apiUrl),
    apiUrlRequestMapping: String(source.apiUrlRequestMapping ?? ''),
    configSource: String(source.configSource ?? ''),
    configSourceName: String(source.configSourceName ?? ''),
    functionCode: String(source.functionCode ?? menu.code),
    functionName: String(source.functionName ?? menu.comment),
    functionType: builderType === 'form' ? '2' : '1',
    parentCode: menu.parentCode,
    parentName: menu.comment,
    remark: String(source.remark ?? ''),
    systemOfConfigSource: String(source.systemOfConfigSource ?? ''),
    ...(source.id ? { id: String(source.id) } : {}),
    // 只有明确标记为 true 才是主列表。
    isPrimaryList: builderType === 'list' ? source.isPrimaryList === true : undefined
  }
}

// 将系统菜单字段和 PageBuilder 本地字段整理为统一菜单实体。
export const normalizeMenu = (item, resolveMenuFolderName) => {
  const code = String(item?.code ?? '').trim()
  const comment = String(item?.comment ?? '').trim()
  const fileName = resolveMenuFolderName(item?.fileName || code || comment || 'menu')
  const parentCode = String(item?.parentCode ?? '')
  const builderType = normalizeBuilderType(item?.builderType)
  const menu = { code, comment, parentCode }

  return {
    code,
    comment,
    fileName,
    parentCode,
    resource: item?.resource ?? '',
    icon: item?.icon ?? null,
    sortIndex: Number.isFinite(Number(item?.sortIndex)) ? Number(item.sortIndex) : 0,
    tstatus: Number.isFinite(Number(item?.tstatus)) ? Number(item.tstatus) : 1,
    competenceCode: String(item?.competenceCode ?? code),
    id: String(item?.id ?? ''),
    roleCodes: Array.isArray(item?.roleCodes) ? item.roleCodes.filter(role => typeof role === 'string') : [],
    tag: item?.tag ?? null,
    builderType,
    pageConfig: normalizePageConfig(builderType, item?.pageConfig, menu),
    type: String(item?.type ?? 'default'),
    viewItem: Number.isFinite(Number(item?.viewItem)) ? Number(item.viewItem) : 1,
    disable: Boolean(item?.disable),
    // 保留前端同步状态，避免数据库回读后丢失“已同步”标记。
    submitStatus: item?.submitStatus === 'submitted' ? 'submitted' : 'draft',
    children: []
  }
}

// 将扁平菜单列表构造成排序后的树和编码索引。
export const buildTree = (flatList, resolveMenuFolderName) => {
  const nodeMap = new Map()
  const codeMap = new Map()

  flatList.forEach(item => {
    const node = normalizeMenu(item, resolveMenuFolderName)
    nodeMap.set(node.id, node)
    codeMap.set(node.code, node)
  })

  const rootNodes = []

  flatList.forEach(item => {
    const current = nodeMap.get(String(item.id))

    if (!current) {
      return
    }

    const parent = item.parentCode ? codeMap.get(String(item.parentCode)) : null

    if (parent && parent.id !== current.id) {
      parent.children.push(current)
      return
    }

    rootNodes.push(current)
  })

  // 按排序字段和菜单名称递归排序树节点。
  const sortTree = nodes => {
    nodes.sort((a, b) => {
      const sortA = Number(a.sortIndex ?? 0)
      const sortB = Number(b.sortIndex ?? 0)

      if (sortA !== sortB) {
        return sortA - sortB
      }

      return a.comment.localeCompare(b.comment, 'zh-Hans-CN')
    })

    nodes.forEach(node => {
      if (node.children.length) {
        sortTree(node.children)
      }
    })
  }

  sortTree(rootNodes)
  return { rootNodes, nodeMap, codeMap }
}

// 递归展开菜单树。
export const flattenTree = nodes => {
  const result = []

  nodes.forEach(node => {
    result.push(node)
    if (node.children.length) {
      result.push(...flattenTree(node.children))
    }
  })

  return result
}

// 获取页面布局类型。
export const getPageLayout = node => {
  const marker = `${String(node?.tag ?? '')} ${String(node?.type ?? '')}`.toLowerCase()

  if (marker.includes('tree')) {
    return 'tree'
  }

  if (marker.includes('component')) {
    return 'component'
  }

  if (marker.includes('form')) {
    return 'form'
  }

  return 'table'
}

// 判断页面是否需要生成树表格脚本。
export const hasTreeLayout = node => getPageLayout(node) === 'tree'

// 获取菜单的标签和类型标记。
export const getNodeMarker = node => `${String(node?.tag ?? '')} ${String(node?.type ?? '')}`.toLowerCase()

// 将菜单实体分类为页面、表格、表单或自定义组件。
export const getNodeKind = node => {
  if (node?.builderType === 'form') {
    return 'form'
  }

  if (node?.builderType === 'list') {
    return 'table'
  }

  if (node?.builderType === 'folder') {
    return 'menu'
  }

  if (node?.builderType === 'page') {
    return 'page'
  }

  throw new Error(`PageBuilder 节点缺少有效类型：${String(node?.id || node?.code || '')}`)
}

// 判断菜单是否是页面下的表单或自定义组件子实体。
export const isSubEntityNode = node => {
  const kind = getNodeKind(node)
  // 列表、表单和自定义组件都属于页面实体，不应再生成独立页面目录。
  return kind === 'table' || kind === 'form' || kind === 'component'
}

// 判断菜单是否可以作为一个页面节点构建。
export const isPageNode = node => !isSubEntityNode(node)

// 收集当前节点的所有祖先节点 ID。
export const collectAncestorIds = (nodeMap, currentNode) => {
  const ancestorIds = []
  let cursor = currentNode

  while (cursor?.parentCode) {
    const parent = nodeMap.get(String(cursor.parentCode))

    if (!parent) {
      break
    }

    ancestorIds.push(parent.id)
    cursor = parent
  }

  return ancestorIds
}

// 收集当前节点下所有后代节点 ID。
export const collectDescendantIds = node => {
  const ids = []

  node.children.forEach(child => {
    ids.push(child.id)
    ids.push(...collectDescendantIds(child))
  })

  return ids
}

// 查找当前节点所在树的根节点。
export const findRootNode = (nodeMap, currentNode) => {
  let cursor = currentNode

  while (cursor?.parentCode) {
    const parent = nodeMap.get(String(cursor.parentCode))

    if (!parent) {
      break
    }

    cursor = parent
  }

  return cursor
}
