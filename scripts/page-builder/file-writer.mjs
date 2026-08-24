import path from 'node:path'
import { rm, writeFile } from 'node:fs/promises'

import { REPO_ROOT } from './constants.mjs'
import {
  copyGeneratedFile,
  ensureDir,
  writeJsonFile
} from './file-utils.mjs'
import { serializeMenuTree } from './project-model.mjs'
import { buildPageJson, buildRenderJson, buildRouterJs } from './render-model.mjs'
import { renderComponentVue } from './renderers/component-renderer.mjs'
import { renderFormVue } from './renderers/form-renderer.mjs'
import { renderTableJs, renderTableVue } from './renderers/table-renderer.mjs'

// 合并页面重新生成的元数据和之前已经保存的本地画布数据。
const mergePageData = (generatedPageData, previousPageData) => {
  const previousComponents = previousPageData?.renderData?.components

  return {
    ...generatedPageData,
    renderData: {
      version: '1.0.0',
      components: Array.isArray(previousComponents) ? previousComponents : []
    }
  }
}

// 创建菜单目录容器，不生成页面文件。
export const writeMenuContainers = async menuContainers => {
  for (const container of menuContainers) {
    if (!container?.containerPath) {
      continue
    }

    await ensureDir(path.join(REPO_ROOT, container.containerPath))

    if (container.childMenuIds?.length && container.childrenPath !== container.containerPath) {
      await ensureDir(path.join(REPO_ROOT, container.childrenPath))
    }
  }
}

// 写入项目级元数据和菜单树快照。
export const writeProjectMetadata = async (project, rootNode, checkedMenuIds) => {
  const projectDir = path.join(REPO_ROOT, project.rootPath)
  await ensureDir(projectDir)

  await writeJsonFile(path.join(projectDir, 'project.json'), {
    projectId: project.projectId,
    projectCode: project.projectCode,
    projectName: project.projectName,
    menuRootId: project.menuRootId,
    rootPath: project.rootPath,
    createdAt: project.createdAt,
    updatedAt: new Date().toISOString()
  })

  await writeJsonFile(path.join(projectDir, 'menus.json'), {
    projectId: project.projectId,
    projectCode: project.projectCode,
    projectName: project.projectName,
    menus: [serializeMenuTree(rootNode, checkedMenuIds)]
  })
}

// 将本地生成的可复制文件复制到业务代码目录。
export const exportCopyableFiles = async database => {
  const artifacts = Array.isArray(database?.tables?.artifacts) ? database.tables.artifacts : []

  for (const artifact of artifacts) {
    if (!artifact.copyable) {
      continue
    }

    const sourceFile = path.join(REPO_ROOT, artifact.filePath)
    const targetFile = path.join(REPO_ROOT, artifact.targetPath)
    await copyGeneratedFile(sourceFile, targetFile)
  }
}

// 写入页面、表格、表单和自定义组件的所有本地文件。
export const writePageFiles = async (bundle, previousPageData = null) => {
  const {
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
    pageData: generatedPageData,
    page
  } = bundle
  const { project, node } = bundle
  const pageData = mergePageData(generatedPageData, previousPageData)

  await ensureDir(pageFolder)
  await ensureDir(sharedFolder)
  // 列表、表单和自定义组件属于当前页面实体，不在页面 children 下生成目录。
  if (bundle.hasPageChildren) {
    await ensureDir(path.join(pageFolder, 'children'))
  }
  await ensureDir(codeFolder)

  if (tableSpecs.length) {
    await ensureDir(tableFolder)
  }

  if (formSpecs.length) {
    await ensureDir(formFolder)
  }

  if (componentSpecs.length) {
    await ensureDir(componentFolder)
  }

  await writeJsonFile(
    path.join(pageFolder, 'page.json'),
    buildPageJson(page, project, node, tableSpecs, formSpecs, componentSpecs)
  )
  // 页面级渲染数据独立保存，组件数量增长时不会继续膨胀 database.json。
  await writeJsonFile(path.join(pageFolder, 'page-data.json'), pageData)
  await writeJsonFile(path.join(sharedFolder, 'menu-map.json'), {
    projectId: project.projectId,
    projectCode: project.projectCode,
    menuId: node.id,
    menuCode: node.code,
    fileName: page.fileName,
    pageId: page.pageId,
    pageCode: page.pageCode,
    targetPath: page.targetPath
  })

  // 页面始终保留路由文件；没有主列表时只生成不带 component 的路由壳。
  await writeFile(path.join(codeFolder, 'router.js'), buildRouterJs(page, primaryTable), 'utf8')

  for (const spec of tableSpecs) {
    await ensureDir(path.dirname(spec.renderPath))
    await ensureDir(path.dirname(spec.exportPath))
    await writeJsonFile(spec.renderPath, buildRenderJson(page, 'table', spec.name))
    await writeFile(spec.exportPath, renderTableVue(page), 'utf8')

    if (spec.scriptPath) {
      await ensureDir(path.dirname(spec.scriptPath))
      await writeFile(spec.scriptPath, renderTableJs(page), 'utf8')
    }
  }

  for (const spec of formSpecs) {
    await ensureDir(path.dirname(spec.renderPath))
    await ensureDir(path.dirname(spec.exportPath))
    await writeJsonFile(spec.renderPath, buildRenderJson(page, 'form', spec.name))
    await writeFile(spec.exportPath, renderFormVue(page, spec.name), 'utf8')
  }

  for (const spec of componentSpecs) {
    await ensureDir(path.dirname(spec.renderPath))
    await ensureDir(path.dirname(spec.exportPath))
    await writeJsonFile(spec.renderPath, buildRenderJson(page, 'component', spec.name))
    await writeFile(spec.exportPath, renderComponentVue(page, spec.name), 'utf8')
  }

  return {
    projectId: project.projectId,
    pageId: page.pageId,
    generated: true
  }
}

// 删除上一次生成的可复制文件，清理已经移除或改名的页面代码。
export const removeCopyableFiles = async (database, repoRoot = REPO_ROOT) => {
  const artifacts = Array.isArray(database?.tables?.artifacts) ? database.tables.artifacts : []

  for (const artifact of artifacts) {
    if (!artifact.copyable) {
      continue
    }

    await rm(path.join(repoRoot, artifact.targetPath), { force: true })
  }
}
