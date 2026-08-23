# PageBuilder 本地实体

本地数据库和路径映射设计请看 [DESIGN.md](./DESIGN.md)。

`database.json` 会保存菜单、页面、视图、组件和可复制代码文件的路径关系，代码输出固定是 `router.js / table / form / component`，其中 `form` 和 `component` 支持按名称拆分多个 `.vue` 文件，并会同步落到 `targetPath`。
