import path from 'node:path'
import { readFile } from 'node:fs/promises'

import { REPO_ROOT, DATABASE_PATH } from './constants.mjs'
import { readBody, readJsonFile } from './file-utils.mjs'
import { createZip } from './zip-writer.mjs'

// 清理菜单名称中的路径字符，避免导出目录被意外拆分。
const sanitizeExportSegment = value => {
  const segment = String(value ?? '').trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')

  return segment || '未命名'
}

// 根据菜单树收集当前菜单及其全部子孙菜单。
const collectSubtreeIds = (menus, rootId) => {
  const ids = new Set([rootId])
  let changed = true

  while (changed) {
    changed = false

    for (const menu of menus) {
      if (ids.has(String(menu.menuId)) || !ids.has(String(menu.parentMenuId || ''))) {
        continue
      }

      ids.add(menu.menuId)
      changed = true
    }
  }

  return ids
}

// 将页面及其父级菜单整理成导出目录路径，目录名称统一使用 fileName。
const buildPageSegments = (menusByCode, rootMenu, pageMenu) => {
  const chain = []
  let cursor = pageMenu

  while (cursor) {
    chain.unshift(cursor)

    if (cursor.menuId === rootMenu.menuId) {
      break
    }

    cursor = cursor.parentMenuCode
      ? menusByCode.get(cursor.parentMenuCode)
      : null
  }

  const rootIndex = chain.findIndex(menu => menu.menuId === rootMenu.menuId)
  const pathChain = rootIndex >= 0 ? chain.slice(rootIndex) : [pageMenu]

  return pathChain
    .filter(menu => menu.builderType === 'folder' || menu.builderType === 'page')
    .map(menu => sanitizeExportSegment(menu.fileName))
}

// 列表和表单独立导出时，去掉页面层级及 table/form 分类层级，只保留自身目录。
const getStandaloneViewPath = (relativePath, rootMenu) => {
  const viewType = rootMenu.builderType === 'list' ? 'table' : 'form'
  const prefix = `${viewType}/${rootMenu.fileName}/`

  if (!relativePath.startsWith(prefix)) {
    throw new Error(`列表或表单代码路径无效：${relativePath}`)
  }

  return path.posix.join(
    sanitizeExportSegment(rootMenu.fileName),
    relativePath.slice(prefix.length)
  )
}

// 获取 artifact 所属页面，页面代码相对路径必须从页面 codeRootPath 计算。
const resolveArtifactPage = (artifact, pagesById) => {
  const page = pagesById.get(String(artifact.pageId || ''))

  if (!page) {
    throw new Error('找不到文件所属页面：' + artifact.filePath)
  }

  return page
}

// 将当前菜单及以下菜单的可复制文件整理成简单导出结构。
export const buildExportEntries = async (database, rootMenuId) => {
  const menus = database?.tables?.menus
  const pages = database?.tables?.pages
  const artifacts = database?.tables?.artifacts

  if (!Array.isArray(menus) || !Array.isArray(pages) || !Array.isArray(artifacts)) {
    throw new Error('本地数据库结构无效，无法导出代码')
  }

  const menusById = new Map(menus.map(menu => [String(menu.menuId), menu]))
  const menusByCode = new Map(menus.map(menu => [String(menu.menuCode), menu]))
  const pagesById = new Map(pages.map(page => [String(page.pageId), page]))
  const rootMenu = menusById.get(String(rootMenuId))

  if (!rootMenu) {
    throw new Error('找不到要导出的菜单')
  }

  const rootPage = rootMenu.builderType === 'list' || rootMenu.builderType === 'form'
    ? pages.find(page => String(page.menuId) === String(rootMenuId))
    : null
  const scopeRootId = rootPage?.menuId || rootMenuId
  const scopeIds = collectSubtreeIds(menus, String(scopeRootId))
  const exportableArtifacts = artifacts.filter(artifact => (
    artifact.copyable && scopeIds.has(String(artifact.menuId))
  ))

  if (!exportableArtifacts.length) {
    throw new Error('当前菜单及子菜单没有可导出的页面代码')
  }

  const entries = []

  for (const artifact of exportableArtifacts) {
    const page = resolveArtifactPage(artifact, pagesById)
    const pageMenu = menusById.get(String(page.menuId))

    if (!pageMenu) {
      throw new Error('找不到页面对应菜单：' + page.pageId)
    }

    const relativePath = path.posix.relative(
      page.codeRootPath.replace(/\\/g, '/'),
      artifact.filePath.replace(/\\/g, '/')
    )

    if (!relativePath || relativePath.startsWith('../')) {
      throw new Error('页面代码路径无效：' + artifact.filePath)
    }

    const entryName = rootMenu.builderType === 'list' || rootMenu.builderType === 'form'
      ? getStandaloneViewPath(relativePath, rootMenu)
      : path.posix.join(
          ...buildPageSegments(menusByCode, rootMenu, pageMenu),
          relativePath
        )
    const sourcePath = path.join(REPO_ROOT, artifact.filePath)

    entries.push({
      name: entryName,
      content: await readFile(sourcePath)
    })
  }

  return {
    rootName: sanitizeExportSegment(rootMenu.fileName || rootMenu.menuName),
    entries
  }
}

// 处理代码导出请求并返回 ZIP 下载文件。
export const handleExport = async (request, response) => {
  const body = await readBody(request)
  const database = await readJsonFile(DATABASE_PATH)
  const result = await buildExportEntries(database, body?.menuId)
  const archive = createZip(result.entries)
  const fileName = result.rootName + '-代码.zip'

  response.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="page-builder-code.zip"; filename*=UTF-8' + "''" + encodeURIComponent(fileName),
    'Content-Length': archive.length,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  })
  response.end(archive)
}
