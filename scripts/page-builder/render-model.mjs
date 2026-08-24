// 生成页面级 page.json 元数据。
export const buildPageJson = (
  page,
  project,
  node,
  tableSpecs = [],
  formSpecs = [],
  componentSpecs = []
) => {
  return {
    pageId: page.pageId,
    pageCode: page.pageCode,
    pageName: page.pageName,
    fileName: page.fileName,
    builderType: node.builderType,
    pageConfig: node.pageConfig,
    pageFolderName: page.pageFolderName,
    codeFolderName: page.codeFolderName,
    pageType: page.pageType,
    pageLayout: page.pageLayout,
    hasTree: page.hasTree,
    projectId: project.projectId,
    menuId: node.id,
    dataPath: page.dataPath,
    routerFilePath: page.routerFilePath,
    codeRootPath: page.codeRootPath,
    tableRootPath: page.tableRootPath,
    formRootPath: page.formRootPath,
    componentRootPath: page.componentRootPath,
    targetPath: page.targetPath,
    primaryListId: page.primaryListId || '',
    primaryListCode: page.primaryListCode || '',
    hasPrimaryList: Boolean(page.hasPrimaryList),
    views: {
      table: page.defaultViewId || null,
      tables: tableSpecs.map(item => item.viewId),
      forms: formSpecs.map(item => item.viewId),
      components: componentSpecs.map(item => item.viewId)
    }
  }
}

// 生成页面、表单或自定义组件的本地渲染描述。
export const buildRenderJson = (page, viewType, displayName = '') => {
  return {
    pageId: page.pageId,
    pageCode: page.pageCode,
    pageName: page.pageName,
    viewType,
    viewName: displayName,
    layout: viewType === 'table'
      ? (page.hasTree ? 'tree-table' : 'table')
      : viewType === 'form'
        ? 'form'
        : 'component',
    hasTree: Boolean(page.hasTree),
    components: viewType === 'table'
      ? [
          { componentCode: 'filter-bar', componentType: 'custom', componentName: '筛选栏' },
          { componentCode: 'el-table', componentType: 'standard', componentName: '表格' }
        ]
      : viewType === 'form'
        ? [
            { componentCode: 'el-form', componentType: 'standard', componentName: displayName || '表单' }
          ]
        : [
            { componentCode: 'custom-component', componentType: 'custom', componentName: displayName || '自定义组件' }
          ]
  }
}

// 生成页面默认路由文件，路由只指向页面下的主列表。
export const buildRouterJs = (page, primaryTable) => {
  const routeName = sanitizeId(page.pageCode)
  const componentLine = primaryTable
    ? `    component: () => import(/* webpackChunkName: "${routeName}" */ '${primaryTable.routePath}'),\n`
    : ''

  return `const router = [
  {
    path: '',
    name: '${routeName}',
    meta: { title: ${JSON.stringify(page.pageName)} },
${componentLine}  },
]

export default router
`
}
import { sanitizeId } from './naming.mjs'
