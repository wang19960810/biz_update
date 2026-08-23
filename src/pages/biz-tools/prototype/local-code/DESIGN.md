# PageBuilder 本地实体设计

## 目标

- 本地可渲染。
- 代码可直接复制到项目使用。
- 菜单提交时可递归创建项目与页面目录。
- 菜单、页面、表格、表单、组件、属性、事件统一映射。

## 核心原则

- `database.json` 是本地数据库。
- 文件系统是派生结果，所有路径都能从数据库反查。
- `render.json` 只给本地预览用。
- 可复制代码固定落到 `router.js / table / form / component`，每个列表都按文件名称生成独立目录；其中 `form` 和 `component` 支持多个子文件按名称生成。
- 页面始终生成 `router.js`；只有明确标记为主列表的列表才会被路由的 `component` 引用。
- 菜单新增时填写的 `fileName` 决定内层代码目录名，外层目录会自动加随机后缀。

## 推荐结构

```txt
local-code/
  database.json
  projects/
    <projectCode>/
      project.json
      menus.json
      pages/
        <fileName>-<random4>/
          page.json
          shared/
            menu-map.json
          views/
            table/
              render.json
            form/
              <name>/
                render.json
            component/
              <name>/
                render.json
          children/
            <childPageCode>/
          <fileName>/
            router.js
            table/
              index.vue
              index.js
            form/
              index.vue
              <name>.vue
            component/
              index.vue
              <name>.vue
```

## 本地数据库

`database.json` 按“表”组织，表之间只保存 ID、文件名和路径。

| 表名 | 作用 |
| --- | --- |
| `projects` | 项目主记录 |
| `menus` | 菜单树、项目、页面和文件夹映射 |
| `pages` | 页面主记录 |
| `views` | 表格/表单预览记录 |
| `components` | 标准/自定义组件实例 |
| `attrs` | 属性记录 |
| `events` | 事件记录 |
| `artifacts` | 可复制代码文件索引 |

## 关键字段

- `projects`: `projectId`, `projectCode`, `projectName`, `rootPath`, `exportRootPath`, `status`
- `menus`: `menuId`, `menuCode`, `menuName`, `fileName`, `parentMenuId`, `projectId`, `pageId`, `folderPath`, `targetPath`, `submitStatus`
- `pages`: `pageId`, `pageCode`, `pageName`, `fileName`, `pageFolderName`, `codeFolderName`, `pageType`, `pageLayout`, `hasTree`, `projectId`, `menuId`, `pageRootPath`, `codeRootPath`, `routerFilePath`, `tableRootPath`, `primaryListId`, `primaryListCode`, `hasPrimaryList`
- `views`: `viewId`, `pageId`, `menuId`, `viewCode`, `viewType`, `viewName`, `renderPath`, `exportPath`
- `components`: `componentId`, `pageId`, `viewId`, `parentComponentId`, `componentType`, `componentCode`, `componentName`, `componentPath`, `exportPath`
- `attrs`: `attrId`, `ownerType`, `ownerId`, `key`, `value`, `valueType`, `bindPath`
- `events`: `eventId`, `ownerType`, `ownerId`, `name`, `handler`, `params`
- `artifacts`: `ownerType`, `ownerId`, `pageId`, `menuId`, `fileRole`, `filePath`, `targetPath`, `copyable`

## 路径关系

- `menu -> project`: 菜单属于哪个项目。
- `menu -> page`: 菜单提交后对应哪个页面。
- `page -> view(table/form)`: 页面下拆成表格和表单两套预览数据。
- `view -> component`: 视图下挂标准组件和自定义组件。
- `component -> attrs/events`: 组件属性和事件独立存表。
- `artifact -> targetPath`: 每个可复制文件都有最终目标路径。

## 生成流程

1. 读取勾选菜单。
2. 按父子顺序生成 `projects`、`menus`、`pages`、`views` 记录。
3. 更新 `database.json`。
4. 创建目录。
5. 写入 `page.json`、`render.json`、`router.js`。
6. 生成 `table/`、`form/`、`component/` 下的可复制代码，并同步复制到 `targetPath`。
7. 递归创建子页面。

## 直接复制

- `router.js` 是页面入口。
- `table/<文件名>/index.vue` 是列表页代码，树形表格额外带同目录下的 `index.js`；即使只有一个列表也保持这个结构。
- `form/index.vue` 是单表单默认文件，多个表单会按名称生成 `form/<name>.vue`。
- `component/index.vue` 是单组件默认文件，多个组件会按名称生成 `component/<name>.vue`。
- 复制时按 `artifacts.targetPath` 落到目标项目。

## 代码导出

从菜单操作中导出当前菜单及以下菜单时，只下载 `copyable: true` 的文件，不包含 `page.json`、`shared`、`views`、`menus.json` 或 `project.json`。

导出 ZIP 内部保持最简单的结构：

```txt
菜单名/
  页面文件名/
    router.js
    table/
    form/
    component/
```

嵌套菜单只增加菜单名称目录，不再生成 `children`、随机目录或其它结构占位目录。

## 默认 `router.js`

```js
const router = [
  {
    path: '',
    name: 'cps_order_return',
    meta: { title: '退货单' },
    component: () => import(/* webpackChunkName: "name" */ './table'),
  },
]

export default router
```
