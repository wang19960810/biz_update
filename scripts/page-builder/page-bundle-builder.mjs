import path from 'node:path'

import { REPO_ROOT } from './constants.mjs'
import {
  sanitizeId,
  toPosix
} from './naming.mjs'
import { buildEntitySpecs, buildTableSpecs } from './entity-specs.mjs'
import {
  createMenuContainerRecord,
  createPageRecord
} from './project-model.mjs'
import { getNodeKind, isSubEntityNode } from './menu-model.mjs'

// 根据页面实际子节点创建列表、表单和自定义组件规格，不再自动补空目录。
const createPageEntitySpecs = async (page, listNodes, formNodes, componentNodes) => {
  const tableSpecs = await buildTableSpecs(page, listNodes)
  const formSpecs = await buildEntitySpecs(page, formNodes, 'form')
  const componentSpecs = await buildEntitySpecs(page, componentNodes, 'component')

  return { tableSpecs, formSpecs, componentSpecs }
}

// 创建页面关联的视图记录。
const createViewRecords = (page, tableSpecs, formSpecs, componentSpecs, isGenerated) => {
  const views = tableSpecs.map(spec => ({
    viewId: spec.viewId,
    pageId: page.pageId,
    menuId: spec.node.id,
    viewCode: spec.stem,
    viewType: 'table',
    viewName: spec.name,
    renderPath: spec.renderPath,
    exportPath: spec.exportPath,
    status: isGenerated ? 'generated' : 'draft'
  }))

  for (const spec of formSpecs) {
    views.push({
      viewId: spec.viewId,
      pageId: page.pageId,
      menuId: spec.node.id,
      viewCode: spec.stem,
      viewType: 'form',
      viewName: spec.name,
      renderPath: spec.renderPath,
      exportPath: spec.exportPath,
      status: isGenerated ? 'generated' : 'draft'
    })
  }

  for (const spec of componentSpecs) {
    views.push({
      viewId: spec.viewId,
      pageId: page.pageId,
      menuId: spec.node.id,
      viewCode: spec.stem,
      viewType: 'component',
      viewName: spec.name,
      renderPath: spec.renderPath,
      exportPath: spec.exportPath,
      status: isGenerated ? 'generated' : 'draft'
    })
  }

  return views
}

// 创建页面、表单和自定义组件的数据库组件记录。
const createComponentRecords = (page, tableSpecs, formSpecs, componentSpecs) => {
  return [
    ...tableSpecs.map(spec => ({
      componentId: spec.componentId,
      pageId: page.pageId,
      viewId: spec.viewId,
      parentComponentId: '',
      componentType: 'standard',
      componentCode: 'el-table',
      componentName: spec.name,
      componentPath: spec.exportPath,
      renderPath: spec.renderPath,
      exportPath: spec.targetPath
    })),
    ...formSpecs.map(spec => ({
      componentId: spec.componentId,
      pageId: page.pageId,
      viewId: spec.viewId,
      parentComponentId: '',
      componentType: 'standard',
      componentCode: spec.stem,
      componentName: spec.name,
      componentPath: spec.exportPath,
      renderPath: spec.renderPath,
      exportPath: spec.targetPath
    })),
    ...componentSpecs.map(spec => ({
      componentId: spec.componentId,
      pageId: page.pageId,
      viewId: spec.viewId,
      parentComponentId: '',
      componentType: 'custom',
      componentCode: spec.stem,
      componentName: spec.name,
      componentPath: spec.exportPath,
      renderPath: spec.renderPath,
      exportPath: spec.targetPath
    }))
  ]
}

// 创建页面默认属性记录。
const createAttributeRecords = (page, tableSpecs, formSpecs) => {
  return [
    {
      attrId: `attr_${sanitizeId(page.pageId)}_title`,
      ownerType: 'page',
      ownerId: page.pageId,
      key: 'title',
      value: page.pageName,
      valueType: 'string',
      bindPath: 'page.title'
    },
    ...tableSpecs.map(spec => ({
      attrId: `attr_${sanitizeId(page.pageId)}_columns_${sanitizeId(spec.stem)}`,
      ownerType: 'component',
      ownerId: spec.componentId,
      key: 'columns',
      value: [
        { label: '菜单名称', prop: 'menuName' },
        { label: '菜单编码', prop: 'menuCode' }
      ],
      valueType: 'json',
      bindPath: `views.${spec.viewId}.components[1].props.columns`
    })),
    ...formSpecs.map(spec => ({
      attrId: `attr_${sanitizeId(page.pageId)}_labelWidth_${sanitizeId(spec.stem)}`,
      ownerType: 'component',
      ownerId: spec.componentId,
      key: 'labelWidth',
      value: 96,
      valueType: 'number',
      bindPath: `views.${spec.viewId}.components[0].props.labelWidth`
    }))
  ]
}

// 创建页面默认事件记录。
const createEventRecords = (page, tableSpecs) => {
  return tableSpecs.map(spec => ({
    eventId: `event_${sanitizeId(page.pageId)}_${sanitizeId(spec.stem)}_row_click`,
    ownerType: 'component',
    ownerId: spec.componentId,
    name: 'row-click',
    handler: 'handleRowClick',
    params: ['row', 'column', 'event']
  }))
}

// 创建本地数据库和可复制代码使用的文件记录。
const createFileRecords = (page, primaryTable, tableSpecs, formSpecs, componentSpecs) => {
  const records = []

  records.push({
    ownerType: 'page',
    ownerId: page.pageId,
    pageId: page.pageId,
    menuId: page.menuId,
    fileRole: 'router',
    filePath: toPosix(page.routerFilePath),
    targetPath: toPosix(path.join(page.targetPath, 'router.js')),
    copyable: true
  })

  records.push({
    ownerType: 'page',
    ownerId: page.pageId,
    pageId: page.pageId,
    menuId: page.menuId,
    fileRole: 'page-json',
    filePath: toPosix(path.join(page.pageRootPath, 'page.json')),
    targetPath: toPosix(path.join(page.targetPath, 'page.json')),
    copyable: false
  })

  for (const spec of tableSpecs) {
    records.push(
      {
        ownerType: 'view',
        ownerId: spec.viewId,
        pageId: page.pageId,
        menuId: spec.node.id,
        fileRole: 'render',
        filePath: spec.renderPath,
        targetPath: spec.renderPath,
        copyable: false
      },
      {
        ownerType: 'view',
        ownerId: spec.viewId,
        pageId: page.pageId,
        menuId: spec.node.id,
        fileRole: 'export',
        filePath: spec.exportPath,
        targetPath: spec.targetPath,
        copyable: true
      }
    )

    if (spec.scriptPath) {
      records.push({
        ownerType: 'view',
        ownerId: spec.viewId,
        pageId: page.pageId,
        menuId: spec.node.id,
        fileRole: 'table-script',
        filePath: spec.scriptPath,
        targetPath: spec.scriptTargetPath,
        copyable: true
      })
    }
  }

  for (const spec of formSpecs) {
    records.push(
      {
        ownerType: 'view',
        ownerId: spec.viewId,
        pageId: page.pageId,
        menuId: spec.node.id,
        fileRole: 'render',
        filePath: spec.renderPath,
        targetPath: spec.renderPath,
        copyable: false
      },
      {
        ownerType: 'view',
        ownerId: spec.viewId,
        pageId: page.pageId,
        menuId: spec.node.id,
        fileRole: 'export',
        filePath: spec.exportPath,
        targetPath: spec.targetPath,
        copyable: true
      }
    )
  }

  for (const spec of componentSpecs) {
    records.push(
      {
        ownerType: 'component',
        ownerId: spec.componentId,
        pageId: page.pageId,
        menuId: spec.node.id,
        fileRole: 'render',
        filePath: spec.renderPath,
        targetPath: spec.renderPath,
        copyable: false
      },
      {
        ownerType: 'component',
        ownerId: spec.componentId,
        pageId: page.pageId,
        menuId: spec.node.id,
        fileRole: 'export',
        filePath: spec.exportPath,
        targetPath: spec.targetPath,
        copyable: true
      }
    )
  }

  return records
}

// 递归构建一个页面及其非实体子页面的完整状态。
export const buildPageBundle = async (
  node,
  project,
  parentPage,
  checkedMenuIds,
  state,
  parentContainer = null
) => {
  // 子实体节点（列表、表单、自定义组件）不单独构建页面，由父页面管理。
  if (parentPage && isSubEntityNode(node)) {
    return null
  }

  const directChildren = Array.isArray(node.children) ? node.children : []
  const pageChildren = directChildren.filter(child => !isSubEntityNode(child))

  // 所有菜单节点都只是目录容器，不生成 page.json、views、shared 或页面代码。
  // 子菜单和页面都从当前菜单的 children 目录继续创建，保留真实父子层级。
  if (node.builderType === 'folder') {
    const menuContainer = createMenuContainerRecord(
      node,
      project,
      parentContainer,
      pageChildren.map(child => child.id)
    )
    state.menuContainers.push(menuContainer)
    node.menuContainerPath = menuContainer.containerPath
    node.menuChildrenPath = menuContainer.childrenPath
    node.menuTargetPath = menuContainer.targetPath
    node.menuChildrenTargetPath = menuContainer.childrenTargetPath

    for (const child of pageChildren) {
      await buildPageBundle(
        child,
        project,
        null,
        checkedMenuIds,
        state,
        menuContainer
      )
    }

    return null
  }

  const page = createPageRecord(node, project, parentPage, parentContainer)
  const isChecked = checkedMenuIds.includes(node.id)
  // 本地服务会完整重建当前页面代码，代码生成状态不再依赖同步勾选状态。
  const isGenerated = true

  // 页面节点才记录到 pages 表并生成本地渲染文件。
  state.pages.push(page)
  node.pageId = page.pageId
  node.page = page

  // 页面代码目录和本地渲染目录。
  const pageFolder = path.join(REPO_ROOT, page.pageRootPath)
  // 页面随机目录保存页面数据，文件名目录保存可复用代码。
  const codeFolder = path.join(pageFolder, page.codeFolderName)
  const sharedFolder = path.join(pageFolder, 'shared')
  const tableFolder = path.join(codeFolder, 'table')
  const formFolder = path.join(codeFolder, 'form')
  const componentFolder = path.join(codeFolder, 'component')
  const listNodes = directChildren.filter(child => getNodeKind(child) === 'table')
  const formNodes = directChildren.filter(child => getNodeKind(child) === 'form')
  const componentNodes = directChildren.filter(child => getNodeKind(child) === 'component')
  const { tableSpecs, formSpecs, componentSpecs } = await createPageEntitySpecs(
    page,
    listNodes,
    formNodes,
    componentNodes
  )
  const primaryTable = tableSpecs.find(spec => spec.isPrimary) || null

  // 页面始终生成路由；只有存在主列表时，路由才指向主列表。
  page.defaultViewId = primaryTable?.viewId || ''
  page.primaryListId = primaryTable?.node?.id || ''
  page.primaryListCode = primaryTable?.node?.code || ''
  page.hasPrimaryList = Boolean(primaryTable)

  const views = createViewRecords(
    page,
    tableSpecs,
    formSpecs,
    componentSpecs,
    isGenerated
  )
  const components = createComponentRecords(
    page,
    tableSpecs,
    formSpecs,
    componentSpecs
  )
  const attrs = createAttributeRecords(page, tableSpecs, formSpecs)
  const events = createEventRecords(page, tableSpecs)
  const pageData = {
    version: '1.0.0',
    pageId: page.pageId,
    pageCode: page.pageCode,
    pageName: page.pageName,
    dataPath: page.dataPath,
    views,
    components,
    attrs,
    events,
    // renderData 是页面专属的本地渲染数据，后续由画布保存接口持续更新。
    renderData: {
      version: '1.0.0',
      components: []
    }
  }

  const fileRecords = createFileRecords(
    page,
    primaryTable,
    tableSpecs,
    formSpecs,
    componentSpecs
  )
  state.generatedFiles.push(...fileRecords)
  state.artifacts.push(...fileRecords)

  state.pageFiles.push({
    page,
    project,
    node,
    pageFolder,
    codeFolder,
    sharedFolder,
    tableFolder,
    formFolder,
    componentFolder,
    tableSpecs,
    primaryTable,
    formSpecs,
    componentSpecs,
    pageData,
    isChecked,
    isGenerated,
    // 只有真正的菜单或页面子节点才需要生成 children 目录。
    hasPageChildren: pageChildren.length > 0
  })

  for (const child of pageChildren) {
    await buildPageBundle(child, project, page, checkedMenuIds, state)
  }

  return page
}
