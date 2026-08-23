import path from 'node:path'

import {
  buildEntityFileName,
  buildEntityRenderPath,
  resolveEntityStem,
  sanitizeId,
  toPosix
} from './naming.mjs'

// 根据页面子节点生成表单或自定义组件的文件规格；表单始终使用文件名称目录。
export const buildEntitySpecs = async (page, nodes, kind) => {
  const fallbackName = kind === 'form' ? '表单' : '自定义组件'
  const baseFolder = kind === 'form' ? page.formRootPath : page.componentRootPath
  const outputFolder = kind === 'form' ? 'form' : 'component'

  if (!nodes.length) {
    return []
  }

  const resolved = await Promise.all(nodes.map(async node => ({
    node,
    stem: await resolveEntityStem(node)
  })))
  // 表单始终使用文件名称目录，保证单表单和多表单结构一致；自定义组件保持原逻辑。
  const multiple = kind === 'form' ? true : resolved.length > 1
  const usedStems = new Set()

  return resolved.map(({ node, stem }, index) => {
    let uniqueStem = stem || `item_${index + 1}`
    let suffix = 2

    while (usedStems.has(uniqueStem)) {
      uniqueStem = `${stem || 'item'}_${suffix++}`
    }

    usedStems.add(uniqueStem)

    const fileName = multiple ? 'index.vue' : buildEntityFileName(uniqueStem, false)
    const entityFolder = multiple ? uniqueStem : ''
    const entityPath = entityFolder
      ? path.join(baseFolder, entityFolder)
      : baseFolder
    const targetEntityPath = entityFolder
      ? path.join(page.targetPath, outputFolder, entityFolder)
      : path.join(page.targetPath, outputFolder)

    return {
      kind,
      node,
      name: node.comment || fallbackName,
      stem: uniqueStem,
      fileName,
      renderPath: buildEntityRenderPath(page, kind, uniqueStem, multiple),
      exportPath: toPosix(path.join(entityPath, fileName)),
      targetPath: toPosix(path.join(targetEntityPath, fileName)),
      viewId: `view_${sanitizeId(page.pageId)}_${kind}_${sanitizeId(uniqueStem)}`,
      componentId: kind === 'form'
        ? `cmp_${sanitizeId(page.pageId)}_form_${sanitizeId(uniqueStem)}`
        : `cmp_${sanitizeId(page.pageId)}_component_${sanitizeId(uniqueStem)}`
    }
  })
}

// 根据页面子节点生成列表规格；列表始终使用各自的文件名称目录。
export const buildTableSpecs = async (page, nodes) => {
  if (!nodes.length) {
    return []
  }

  const resolved = await Promise.all(nodes.map(async node => ({
    node,
    stem: await resolveEntityStem(node)
  })))
  // 列表始终使用文件名称目录，保证单列表和多列表结构一致。
  const multiple = true
  const usedStems = new Set()

  return resolved.map(({ node, stem }, index) => {
    let uniqueStem = stem || `list_${index + 1}`
    let suffix = 2

    while (usedStems.has(uniqueStem)) {
      uniqueStem = `${stem || 'list'}_${suffix++}`
    }

    usedStems.add(uniqueStem)

    const tableFolder = multiple ? uniqueStem : ''
    const tablePath = tableFolder
      ? path.join(page.tableRootPath, tableFolder)
      : page.tableRootPath
    const targetTablePath = tableFolder
      ? path.join(page.targetPath, 'table', tableFolder)
      : path.join(page.targetPath, 'table')

    return {
      kind: 'table',
      node,
      name: node.comment || '列表',
      stem: uniqueStem,
      fileName: 'index.vue',
      renderPath: buildEntityRenderPath(page, 'table', uniqueStem, multiple),
      exportPath: toPosix(path.join(tablePath, 'index.vue')),
      targetPath: toPosix(path.join(targetTablePath, 'index.vue')),
      scriptPath: page.hasTree ? toPosix(path.join(tablePath, 'index.js')) : '',
      scriptTargetPath: page.hasTree ? toPosix(path.join(targetTablePath, 'index.js')) : '',
      routePath: tableFolder ? `./table/${tableFolder}` : './table',
      viewId: `view_${sanitizeId(page.pageId)}_table_${sanitizeId(uniqueStem)}`,
      componentId: `cmp_${sanitizeId(page.pageId)}_table_${sanitizeId(uniqueStem)}`,
      // 主列表必须由页面数据显式标记，普通列表不能自动接管页面路由。
      isPrimary: node.pageConfig?.isPrimaryList === true
    }
  })
}
