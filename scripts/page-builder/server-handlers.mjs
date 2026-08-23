import path from 'node:path'

import {
  DATABASE_PATH,
  LOCAL_CODE_ROOT,
  OUTPUT_CODE_ROOT,
  REPO_ROOT
} from './constants.mjs'
import {
  ensureDir,
  readBody,
  readJsonFile,
  removeDir,
  sendJson,
  writeJsonFile
} from './file-utils.mjs'
import { buildDatabaseFromMenus } from './database-builder.mjs'
import { handleExport } from './export-service.mjs'
import {
  exportCopyableFiles,
  removeCopyableFiles,
  writeMenuContainers,
  writePageFiles,
  writeProjectMetadata
} from './file-writer.mjs'

// 处理菜单同步、数据库写入、本地代码生成和业务代码导出。
export const handleSync = async (request, response) => {
  const body = await readBody(request)
  const previousDatabase = await readJsonFile(DATABASE_PATH)
  const { database, state, rootNodes, checkedMenuIds } = await buildDatabaseFromMenus(body)

  await ensureDir(LOCAL_CODE_ROOT)
  await removeDir(path.join(LOCAL_CODE_ROOT, 'projects'))

  const projectCodes = new Set([
    ...((previousDatabase?.tables?.projects) || [])
      .map(project => String(project?.projectCode || '').trim())
      .filter(Boolean),
    ...database.tables.projects
      .map(project => String(project?.projectCode || '').trim())
      .filter(Boolean)
  ])

  for (const projectCode of projectCodes) {
    await removeDir(path.join(OUTPUT_CODE_ROOT, projectCode))
  }

  await writeJsonFile(DATABASE_PATH, database)

  const generated = []
  const rootProjectMap = new Map(rootNodes.map(node => [node.id, node]))
  for (const project of database.tables.projects) {
    const rootNode = rootProjectMap.get(project.menuRootId)

    if (!rootNode) {
      continue
    }

    await writeProjectMetadata(project, rootNode, checkedMenuIds)
  }

  await writeMenuContainers(database.tables.menuContainers || [])

  for (const bundle of state.pageFiles) {
    // 本地代码跟随当前菜单数据完整重建，不能因为删除主列表时未勾选页面而把页面代码一并删除。
    generated.push(await writePageFiles(bundle))
  }

  await removeCopyableFiles(previousDatabase, REPO_ROOT)
  await exportCopyableFiles(database)

  sendJson(response, 200, {
    code: 0,
    message: 'ok',
    data: {
      database,
      projects: database.tables.projects.length,
      menus: database.tables.menus.length,
      pages: database.tables.pages.length,
      generated,
      roots: rootNodes.map(node => node.code)
    }
  })
}

// 返回 PageBuilder 当前本地数据库内容。
export const handleDatabase = async (_request, response) => {
  const database = await readJsonFile(DATABASE_PATH)
  sendJson(response, 200, {
    code: 0,
    message: 'ok',
    data: database
  })
}

// 只更新本地数据库中的同步状态，不重新生成页面和复制业务代码。
export const handleLocalStatus = async (request, response) => {
  const body = await readBody(request)
  const database = await readJsonFile(DATABASE_PATH)
  const syncedMenuIds = new Set(
    Array.isArray(body?.syncedMenuIds)
      ? body.syncedMenuIds.filter(item => typeof item === 'string')
      : []
  )
  const checkedMenuIds = new Set(
    Array.isArray(body?.checkedMenuIds)
      ? body.checkedMenuIds.filter(item => typeof item === 'string')
      : []
  )
  const menus = Array.isArray(database?.tables?.menus) ? database.tables.menus : []

  database.tables.menus = menus.map(menu => {
    const menuId = String(menu?.menuId ?? '')

    return {
      ...menu,
      checked: checkedMenuIds.has(menuId),
      submitStatus: syncedMenuIds.has(menuId)
        ? 'submitted'
        : menu.submitStatus === 'submitted'
          ? 'submitted'
          : 'draft'
    }
  })

  await writeJsonFile(DATABASE_PATH, database)

  sendJson(response, 200, {
    code: 0,
    message: 'ok',
    data: {
      updatedMenuIds: [...syncedMenuIds],
      checkedMenuIds: [...checkedMenuIds]
    }
  })
}

// 导出当前菜单及其子孙菜单的可复制代码，不包含本地渲染元数据。
export { handleExport }
