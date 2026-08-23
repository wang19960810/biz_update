import path from 'node:path'

// PageBuilder 服务监听端口。
export const PORT = 3002

// 当前项目根目录。
export const REPO_ROOT = process.cwd()

// PageBuilder 本地数据库和可渲染数据的根目录。
export const LOCAL_CODE_ROOT = path.join(REPO_ROOT, 'src/pages/biz-tools/prototype/local-code')

// 复制到业务页面目录时使用的目标根目录。
export const OUTPUT_CODE_ROOT = path.join(REPO_ROOT, 'src/pages/biz-tools')

// PageBuilder 本地数据库文件路径。
export const DATABASE_PATH = path.join(LOCAL_CODE_ROOT, 'database.json')

// 数据库首次创建时使用的空结构。
export const DEFAULT_DATABASE = {
  version: '2.5.0',
  rootDir: 'src/pages/biz-tools/prototype/local-code',
  projectRootDir: 'src/pages/biz-tools/prototype/local-code/projects',
  tables: {
    projects: [],
    menus: [],
    menuContainers: [],
    pages: [],
    views: [],
    components: [],
    attrs: [],
    events: [],
    artifacts: []
  }
}
