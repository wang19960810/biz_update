import path from 'node:path'

import {
  nowIso,
  resolveMenuFolderName,
  resolvePageFolderName,
  sanitizeCode,
  sanitizeId,
  toPosix
} from './naming.mjs'
import { getPageLayout, hasTreeLayout } from './menu-model.mjs'

// 根据根菜单创建一个本地项目记录。
export const createProjectRecord = rootNode => {
  // 根菜单同时作为本地项目容器，项目目录使用菜单文件名加随机后缀。
  const projectCode = resolvePageFolderName(
    rootNode.fileName || rootNode.code || rootNode.comment || 'project'
  )
  const projectId = `proj_${sanitizeId(projectCode)}`

  return {
    projectId,
    projectCode,
    projectName: rootNode.comment || projectCode,
    rootPath: toPosix(path.join('src/pages/biz-tools/prototype/local-code/projects', projectCode)),
    exportRootPath: toPosix(path.join('src/pages/biz-tools/prototype/local-code/projects', projectCode, 'export')),
    menuRootId: rootNode.id,
    status: 'draft',
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
}

// 为菜单节点创建本地目录容器，不创建页面文件或页面记录。
export const createMenuContainerRecord = (
  node,
  project,
  parentContainer = null,
  childMenuIds = []
) => {
  const menuFolderName = resolvePageFolderName(
    node.fileName || node.code || node.comment || 'menu'
  )
  const containerPath = parentContainer
    ? toPosix(path.join(parentContainer.childrenPath, menuFolderName))
    : project.rootPath
  const childrenPath = toPosix(path.join(containerPath, 'children'))
  const targetPath = parentContainer
    ? toPosix(path.join(parentContainer.childrenTargetPath, menuFolderName))
    : toPosix(path.join('src/pages/biz-tools', project.projectCode))
  const childrenTargetPath = toPosix(path.join(targetPath, 'children'))

  return {
    menuId: node.id,
    menuCode: node.code,
    menuName: node.comment,
    fileName: resolveMenuFolderName(node.fileName || node.code || node.comment || 'menu'),
    containerPath,
    childrenPath,
    targetPath,
    childrenTargetPath,
    childMenuIds,
    parentContainerPath: parentContainer?.containerPath || '',
    projectId: project.projectId
  }
}

// 根据菜单节点和父页面创建页面目录、代码目录及关联路径。
export const createPageRecord = (node, project, parentPage = null, parentContainer = null) => {
  // 避免缺少关键字段时无法生成路径，fileName、code、comment 和 pageCode 至少需要一个有效值。
  const primaryName = String(node.fileName ?? '').trim()
    || String(node.code ?? '').trim()
    || String(node.comment ?? '').trim()
  
  if (!primaryName) {
    throw new Error(`菜单「${node.id || 'unknown'}」缺少 fileName、code 和 comment，无法生成页面路径`)
  }

  // 每个实际页面使用自身编码，避免不同菜单下的页面共享同一个 pageId。
  const pageCode = sanitizeCode(node.code || primaryName)
  const codeFolderName = resolveMenuFolderName(primaryName)
  // 根页面本身就是项目入口，直接复用项目目录，避免项目目录下再次嵌套同名页面目录。
  const isProjectRootPage = node.builderType === 'page'
    && !parentPage
    && !parentContainer
    && project.menuRootId === node.id
  const pageFolderName = isProjectRootPage
    ? project.projectCode
    : resolvePageFolderName(codeFolderName)
  const pageId = `page_${sanitizeId(pageCode)}`
  const parentChildrenPath = parentPage?.childrenPath || parentContainer?.childrenPath
  const pageRootPath = parentChildrenPath
    ? toPosix(path.join(parentChildrenPath, pageFolderName))
    : isProjectRootPage
      ? project.rootPath
      : toPosix(path.join(project.rootPath, pageFolderName))
  const pageLayout = getPageLayout(node)
  const hasTree = hasTreeLayout(node)
  // 页面随机目录承载本地页面数据，文件名目录单独承载可复用代码。
  const codeRootPath = toPosix(path.join(pageRootPath, codeFolderName))
  const targetParentPath = parentPage
    ? path.join(parentPage.targetPath, 'children')
    : parentContainer?.childrenTargetPath
      || path.join('src/pages/biz-tools', project.projectCode)

  return {
    pageId,
    pageCode,
    pageName: node.comment || pageCode,
    fileName: codeFolderName,
    pageFolderName,
    codeFolderName,
    pageType: parentPage || parentContainer ? 'page' : 'container',
    pageLayout,
    hasTree,
    projectId: project.projectId,
    menuId: node.id,
    pageRootPath,
    sharedPath: toPosix(path.join(pageRootPath, 'shared')),
    childrenPath: toPosix(path.join(pageRootPath, 'children')),
    viewRootPath: toPosix(path.join(pageRootPath, 'views')),
    exportRootPath: toPosix(path.join(pageRootPath, 'export')),
    codeRootPath,
    routerFilePath: toPosix(path.join(codeRootPath, 'router.js')),
    tableRootPath: toPosix(path.join(codeRootPath, 'table')),
    formRootPath: toPosix(path.join(codeRootPath, 'form')),
    componentRootPath: toPosix(path.join(codeRootPath, 'component')),
    targetPath: isProjectRootPage
      ? toPosix(path.join('src/pages/biz-tools', project.projectCode))
      : toPosix(path.join(targetParentPath, pageFolderName)),
    defaultViewId: `view_${sanitizeId(pageId)}_table`,
    // 页面级主列表标记，由页面生成阶段根据列表子节点补全。
    primaryListId: '',
    primaryListCode: '',
    hasPrimaryList: false
  }
}

// 将菜单树转换为项目元数据中使用的递归结构。
export const serializeMenuTree = (node, checkedMenuIds) => {
  return {
    menuId: node.id,
    menuCode: node.code,
    menuName: node.comment,
    fileName: node.fileName || '',
    builderType: node.builderType,
    pageConfig: node.pageConfig,
    parentMenuCode: node.parentCode,
    menuContainerPath: node.menuContainerPath || '',
    menuChildrenPath: node.menuChildrenPath || '',
    pageId: node.pageId || '',
    resource: node.resource || '',
    icon: node.icon || null,
    submitStatus: node.submitStatus === 'submitted' ? 'submitted' : 'draft',
    checked: checkedMenuIds.includes(node.id),
    sortIndex: node.sortIndex,
    children: node.children.map(child => serializeMenuTree(child, checkedMenuIds))
  }
}

// 从任意菜单节点向上查找所属页面节点。
export const findOwningPageNode = (nodeMap, node) => {
  let cursor = node

  while (cursor) {
    if (cursor.pageId) {
      return cursor
    }

    if (!cursor.parentCode) {
      break
    }

    const parent = nodeMap.get(String(cursor.parentCode))

    if (!parent) {
      break
    }

    cursor = parent
  }

  return cursor
}

// 创建项目快照的基础结构，供后续扩展项目级元数据使用。
export const createProjectSnapshot = (project, rootNode) => {
  return {
    projectId: project.projectId,
    projectCode: project.projectCode,
    projectName: project.projectName,
    rootMenuId: rootNode.id,
    pages: [],
    menus: []
  }
}
