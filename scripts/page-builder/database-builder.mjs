import { buildPageBundle } from './page-bundle-builder.mjs'
import {
  buildTree,
  collectAncestorIds,
  collectDescendantIds,
  findRootNode,
  normalizeMenu
} from './menu-model.mjs'
import { createProjectRecord, findOwningPageNode } from './project-model.mjs'
import { nowIso, resolveMenuFolderName } from './naming.mjs'

// 创建一次同步所需的内存状态容器。
const createBuildState = generationIds => {
  return {
    projects: [],
    menus: [],
    pages: [],
    views: [],
    components: [],
    attrs: [],
    events: [],
    artifacts: [],
    menuContainers: [],
    generatedFiles: [],
    pageFiles: [],
    generationIds
  }
}

// 将菜单和本地字段合并后，构建本地数据库和代码生成状态。
export const buildDatabaseFromMenus = async payload => {
  // systemMenus 只包含系统菜单字段，localState 只包含 PageBuilder 本地字段。
  // 两部分在本地服务内按菜单编码合并，避免本地字段进入系统菜单请求模型。
  if (
    !Array.isArray(payload?.systemMenus)
    || !Array.isArray(payload?.localState?.menus)
    || !Array.isArray(payload?.localState?.checkedMenuIds)
  ) {
    throw new Error('PageBuilder 同步数据格式无效')
  }

  const systemMenus = payload.systemMenus
  const localStateMenus = payload.localState.menus
  const localMenuMap = new Map(
    localStateMenus.map(item => [String(item?.code ?? '').trim(), item])
  )
  const rawMenus = systemMenus.map(item => ({
    ...item,
    ...(localMenuMap.get(String(item?.code ?? '').trim()) || {})
  }))
  const checkedMenuIds = payload.localState.checkedMenuIds.filter(item => typeof item === 'string')
  const normalizedMenus = rawMenus.map(item => normalizeMenu(item, resolveMenuFolderName))
  const { rootNodes, nodeMap, codeMap } = buildTree(normalizedMenus, resolveMenuFolderName)

  // 勾选节点会带上祖先和后代，确保父子目录可以独立生成且结构完整。
  const generationIds = new Set()
  checkedMenuIds.forEach(id => {
    const node = nodeMap.get(id)
    if (!node) {
      return
    }

    generationIds.add(node.id)
    collectAncestorIds(nodeMap, node).forEach(item => generationIds.add(item))
    collectDescendantIds(node).forEach(item => generationIds.add(item))
  })

  const state = createBuildState(generationIds)

  for (const rootNode of rootNodes) {
    const project = createProjectRecord(rootNode)
    state.projects.push(project)
    await buildPageBundle(rootNode, project, null, checkedMenuIds, state)
  }

  const now = nowIso()

  const menus = normalizedMenus.map(menu => {
    const treeNode = nodeMap.get(menu.id)
    const pageNode = treeNode ? findOwningPageNode(nodeMap, treeNode) : null
    const page = pageNode ? state.pages.find(item => item.pageId === pageNode.pageId) : null
    const rootNode = findRootNode(nodeMap, treeNode)
    const project = state.projects.find(item => item.menuRootId === rootNode?.id)
    const parentNode = menu.parentCode ? codeMap.get(menu.parentCode) : null

    return {
      menuId: menu.id,
      menuCode: menu.code,
      menuName: menu.comment,
      fileName: menu.fileName,
      builderType: menu.builderType,
      pageConfig: menu.pageConfig,
      parentMenuId: parentNode?.id || '',
      parentMenuCode: menu.parentCode || '',
      projectId: project?.projectId || state.projects[0]?.projectId || '',
      pageId: page?.pageId || '',
      // 页面保存页面路径，菜单保存自己的目录容器路径。
      folderPath: page?.pageRootPath || treeNode?.menuContainerPath || '',
      targetPath: page?.targetPath || treeNode?.menuTargetPath || '',
      resource: menu.resource,
      icon: menu.icon,
      tstatus: menu.tstatus,
      competenceCode: menu.competenceCode,
      roleCodes: [...menu.roleCodes],
      tag: menu.tag,
      type: menu.type,
      viewItem: menu.viewItem,
      disable: menu.disable,
      // checked 表示当前待处理选择，submitStatus 才表示已经同步成功；两者不能混用。
      submitStatus: menu.submitStatus === 'submitted' ? 'submitted' : 'draft',
      checked: checkedMenuIds.includes(menu.id),
      sortIndex: menu.sortIndex,
      childrenMenuIds: treeNode?.children.map(child => child.id) || [],
      updatedAt: now
    }
  })

  const pages = state.pages.map(page => ({
    ...page,
    updatedAt: now
  }))

  const projects = state.projects.map(project => ({
    ...project,
    updatedAt: now
  }))

  const database = {
    version: '2.5.0',
    rootDir: 'src/pages/biz-tools/prototype/local-code',
    projectRootDir: 'src/pages/biz-tools/prototype/local-code/projects',
    tables: {
      projects,
      menus,
      menuContainers: state.menuContainers,
      pages,
      views: state.views,
      components: state.components,
      attrs: state.attrs,
      events: state.events,
      artifacts: state.artifacts
    }
  }

  return { database, state, rootNodes, nodeMap, checkedMenuIds }
}
