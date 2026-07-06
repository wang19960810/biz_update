<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { useMenuStore } from "@src/store/transfer-menu/menuStore.ts";
import { usePageConfigStore } from "@src/store/transfer-menu/pageConfigStore.ts";
import { useTransferMenuGlobalStore } from "@src/store/transfer-menu/transferMenuGlobalStore.ts";
import type { MenuItem, PageConfig } from "../../types/index.d.ts";

const props = defineProps<{
  title: string
  description: string
  panelType?: string
}>()

const menuStore = useMenuStore()
const pageConfigStore = usePageConfigStore()
const transferMenuGlobalStore = useTransferMenuGlobalStore()

// 面板类型与菜单筛选条件
const isPageLayoutPanel = computed(() => props.panelType === 'page-layout')
const testSearchMenuName = ref<string>('')
const activeMenuCode = ref<string>('')
const currentMenuName = ref<string>('')

// 接口加载状态
const menuDataLoading = ref(false)
const pageConfigLoading = ref(false)

// 页面配置勾选结果与骨架屏控制
const selectedPageConfigs = ref<PageConfig[]>([])
const menuTableReady = ref(false)
const pageConfigTableReady = ref(false)
const showMenuTableSkeleton = computed(() => menuDataLoading.value || !menuTableReady.value)
const showPageConfigTableSkeleton = computed(() => pageConfigLoading.value || !pageConfigTableReady.value)

// 延迟渲染定时器与请求版本号
let menuTableTimer: number | null = null
let pageConfigTableTimer: number | null = null
let pageConfigRequestVersion = 0

// 统一处理搜索关键字，避免大小写和首尾空格影响筛选结果
const normalizeKeyword = (value: string) => value.trim().toLowerCase()

// 判断单个菜单名称或编码是否命中关键字
const menuMatchesKeyword = (menu: MenuItem, keyword: string) => {
  return [menu.comment, menu.code]
    .filter(Boolean)
    .some(item => item.toLowerCase().includes(keyword))
}

// 递归过滤菜单树，保留命中项及其必要的父级节点
const filterMenuTree = (menus: MenuItem[], keyword: string): MenuItem[] => {
  const normalizedKeyword = normalizeKeyword(keyword)

  if (!normalizedKeyword) {
    return menus
  }

  return menus.reduce<MenuItem[]>((result, menu) => {
    if (menuMatchesKeyword(menu, normalizedKeyword)) {
      result.push(menu)
      return result
    }

    const filteredChildren = filterMenuTree(menu.children || [], normalizedKeyword)

    if (filteredChildren.length) {
      result.push({
        ...menu,
        children: filteredChildren
      })
    }

    return result
  }, [])
}

// 左侧菜单树、右侧页面配置列表，以及当前勾选项编码展示
const testMenuList = computed(() => filterMenuTree(menuStore.menuListDataTest, testSearchMenuName.value))
const pageConfigList = computed(() => pageConfigStore.pageOptionTest)
const selectedPageConfigCodes = computed(() => selectedPageConfigs.value.map(item => item.functionCode))

// 页面配置面板先读取测试环境菜单树，再从当前菜单下选择页面配置同步到正式环境
const ensureMenuData = async () => {
  if (!menuStore.menuListDataTest.length) {
    menuStore.menuListDataTest = await menuStore.fetchMenu('test')
  }
}

const loadMenuDataIfNeeded = async () => {
  if (menuStore.menuListDataTest.length || menuDataLoading.value) {
    return
  }

  menuDataLoading.value = true

  try {
    await ensureMenuData()
  } finally {
    menuDataLoading.value = false
  }
}

// 切换菜单时清空上一次的页面配置缓存与勾选结果，避免旧数据继续参与同步
const clearPageConfigState = () => {
  pageConfigStore.resetPageConfigCache()
  selectedPageConfigs.value = []
}

// 记录当前点击的菜单，用于右侧列表展示与同步完成后的重新加载
const setCurrentMenu = (menu: MenuItem) => {
  activeMenuCode.value = menu.code
  currentMenuName.value = menu.comment
  menuStore.selectedMenuTest = [JSON.parse(JSON.stringify(menu))]
}

// 点击测试环境菜单后，只查询测试环境页面配置
// 正式环境是否已存在，放到执行同步时再判断，避免列表查询阶段额外增加请求压力
const loadPageConfigsByMenu = async (menu: MenuItem) => {
  const requestVersion = ++pageConfigRequestVersion
  setCurrentMenu(menu)
  clearPageConfigState()
  pageConfigLoading.value = true

  try {
    const testResult = await pageConfigStore.getMenuPageOptionByEnv(menu, 'test')
    if (requestVersion !== pageConfigRequestVersion) {
      return
    }

    if (!testResult?.data?.result?.records) {
      pageConfigStore.pageOptionTest = []
      return
    }

    const testRecords = (testResult.data.result.records || []).map((item: PageConfig) => ({
      ...item,
      parentName: menu.comment
    }))

    pageConfigStore.pageOptionTest = testRecords
  } finally {
    if (requestVersion === pageConfigRequestVersion) {
      pageConfigLoading.value = false
    }
  }
}

// 菜单点击事件：加载该菜单对应的页面配置
const handleMenuRowClick = (row: MenuItem) => {
  void loadPageConfigsByMenu(row)
}

// 页面配置表格勾选变化时，同步更新当前待同步列表
const handlePageConfigSelectionChange = (value: PageConfig[]) => {
  selectedPageConfigs.value = JSON.parse(JSON.stringify(value))
}

// 页面配置同步分两步：
// 1. 先查询正式环境是否已存在同编码页面配置，再决定本次走新增还是更新
// 2. 再同步该页面配置下的字段明细
const syncSelectedPageConfigs = async () => {
  if (!selectedPageConfigs.value.length) {
    ElMessage.info('请选择需要同步到正式环境的页面配置')
    return
  }

  transferMenuGlobalStore.loading = true

  try {
    const currentMenu = menuStore.selectedMenuTest[0]
    let prodRecords: PageConfig[] = []

    if (currentMenu) {
      const prodResult = await pageConfigStore.getMenuPageOptionByEnv(currentMenu, 'prod')
      prodRecords = prodResult?.data?.result?.records || []
    }

    const baseRequests = selectedPageConfigs.value.map(async (item: PageConfig) => {
      const syncTarget = {
        ...item
      }

      const matched = prodRecords.find((prodItem: PageConfig) => prodItem.functionCode === item.functionCode)

      if (matched?.id) {
        syncTarget.id = matched.id
      } else {
        delete syncTarget.id
      }

      await pageConfigStore.startUpdatePageConfig(syncTarget)
      await pageConfigStore.getPageConfigOption(syncTarget, true)
    })

    await Promise.allSettled(baseRequests)
    ElMessage.success('页面配置同步完成')

    // 同步完成后重新加载当前菜单，刷新右侧页面配置同步状态
    if (currentMenu) {
      await loadPageConfigsByMenu(currentMenu)
    }
  } finally {
    transferMenuGlobalStore.loading = false
  }
}

// 左右两张表初次渲染成本较高，这里拆到两个渲染帧中挂载，减少进入页面时的卡顿感
const warmUpTables = () => {
  if (menuTableReady.value && pageConfigTableReady.value) {
    return
  }

  if (!menuTableReady.value && !menuTableTimer) {
    menuTableTimer = window.setTimeout(() => {
      menuTableReady.value = true
      menuTableTimer = null

      if (!pageConfigTableReady.value && !pageConfigTableTimer) {
        pageConfigTableTimer = window.setTimeout(() => {
          pageConfigTableReady.value = true
          pageConfigTableTimer = null
        }, 16)
      }
    }, 0)

    return
  }

  if (!pageConfigTableReady.value && !pageConfigTableTimer) {
    pageConfigTableTimer = window.setTimeout(() => {
      pageConfigTableReady.value = true
      pageConfigTableTimer = null
    }, 16)
  }
}

// 首次进入页面配置面板时，预热表格并按需加载测试环境菜单数据
onMounted(async () => {
  if (!isPageLayoutPanel.value) {
    return
  }

  warmUpTables()
  await loadMenuDataIfNeeded()
})

// 缓存激活后重新预热表格，并确保菜单数据可用
onActivated(async () => {
  if (!isPageLayoutPanel.value) {
    return
  }

  warmUpTables()
  await loadMenuDataIfNeeded()
})

// 离开当前面板时清理选中菜单、页面配置缓存与未完成请求状态
onDeactivated(() => {
  if (!isPageLayoutPanel.value) {
    return
  }

  pageConfigRequestVersion++
  activeMenuCode.value = ''
  currentMenuName.value = ''
  pageConfigLoading.value = false
  clearPageConfigState()
  menuStore.selectedMenuTest = []
})

// 组件销毁前清理延迟渲染定时器
onBeforeUnmount(() => {
  if (menuTableTimer) {
    window.clearTimeout(menuTableTimer)
    menuTableTimer = null
  }

  if (pageConfigTableTimer) {
    window.clearTimeout(pageConfigTableTimer)
    pageConfigTableTimer = null
  }
})
</script>

<template>
  <section v-if="isPageLayoutPanel" class="workspace-card" v-loading="transferMenuGlobalStore.loading">
    <div class="workspace-header">
      <div>
        <p class="workspace-kicker">Page Config</p>
        <h2>{{ title }}</h2>
      </div>
      <p class="workspace-tip">
        左侧为测试环境菜单树，点击菜单后只查询测试环境页面配置；右侧勾选需要同步的页面配置后，再判断正式环境是更新还是新增，并同步字段明细。
      </p>
    </div>

    <div class="workspace-body">
      <div class="menu-content">
        <div class="left-content">
          <div class="search-box">
            <el-input
              v-model="testSearchMenuName"
              class="input-box"
              type="text"
              placeholder="请输入菜单名称或编码"
              clearable
            />
          </div>

          <!-- 测试环境菜单树：点击菜单后加载该菜单下的测试页面配置 -->
          <div v-if="showMenuTableSkeleton" class="table-skeleton" aria-hidden="true">
            <div v-for="item in 7" :key="`menu-skeleton-${item}`" class="skeleton-row menu-skeleton-row">
              <div class="skeleton-block skeleton-cell medium"></div>
              <div class="skeleton-block skeleton-cell medium"></div>
              <div class="skeleton-block skeleton-cell short"></div>
            </div>
          </div>

          <el-table
            v-else
            :data="testMenuList"
            :tree-props="{ checkStrictly: false }"
            row-key="id"
            :default-expand-all="Boolean(testSearchMenuName)"
            :empty-text="testSearchMenuName ? '暂无匹配菜单' : '暂无数据'"
            highlight-current-row
            :current-row-key="activeMenuCode"
            @row-click="handleMenuRowClick"
          >
            <el-table-column prop="comment" label="菜单名称" />
            <el-table-column prop="code" label="菜单编码" />
            <el-table-column prop="tstatus" label="启禁用" width="100">
              <template #default="scope">
                {{ scope.row.tstatus === 1 ? "启用" : "禁用" }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="right-content">
          <div class="selection-summary">
            <div>
              <p class="summary-label">当前菜单</p>
              <strong>{{ currentMenuName || '未选择菜单' }}</strong>
            </div>
            <el-button type="primary" :disabled="!selectedPageConfigs.length" @click="syncSelectedPageConfigs">
              同步选中页面配置
            </el-button>
          </div>

          <!-- 页面配置同步：先更新正式环境基础配置，再同步内部字段明细 -->
          <div v-if="showPageConfigTableSkeleton" class="table-skeleton" aria-hidden="true">
            <div v-for="item in 7" :key="`page-config-skeleton-${item}`" class="skeleton-row config-skeleton-row">
              <div class="skeleton-block skeleton-cell checkbox"></div>
              <div class="skeleton-block skeleton-cell medium"></div>
              <div class="skeleton-block skeleton-cell long"></div>
              <div class="skeleton-block skeleton-cell short"></div>
              <div class="skeleton-block skeleton-cell medium"></div>
            </div>
          </div>

          <el-table
            v-else
            :data="pageConfigList"
            row-key="functionCode"
            :empty-text="activeMenuCode ? '当前菜单暂无页面配置' : '请先点击左侧菜单'"
            @selection-change="handlePageConfigSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="functionName" label="页面配置名称" min-width="160" />
            <el-table-column prop="functionCode" label="功能编码" min-width="180" />
            <el-table-column prop="functionType" label="类型" width="90">
              <template #default="scope">
                {{ scope.row.functionType === '1' ? '列表' : '表单' }}
              </template>
            </el-table-column>
            <el-table-column prop="configSourceName" label="数据源" min-width="140" />
            <el-table-column prop="apiUrl" label="接口路径" min-width="220" show-overflow-tooltip />
          </el-table>

          <p v-if="selectedPageConfigCodes.length" class="selection-hint">
            已选 {{ selectedPageConfigCodes.length }} 项：{{ selectedPageConfigCodes.join('，') }}
          </p>
        </div>
      </div>
    </div>
  </section>

  <section v-else class="coming-soon-card">
    <div class="coming-soon-copy">
      <p class="coming-soon-kicker">Coming Soon</p>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <div class="coming-soon-tips">
      <span>入口已接入</span>
      <span>组件待接入</span>
      <span>可直接扩展</span>
    </div>
  </section>
</template>

<style scoped lang="less">
.workspace-card {
  min-height: 620px;
  padding: 22px 24px 24px;
  display: flex;
  flex-direction: column;
  overflow: visible;
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(247, 250, 252, 0.78));
  box-shadow: 0 20px 56px rgba(24, 39, 69, 0.08);
  backdrop-filter: blur(12px);
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-shrink: 0;
  min-width: 0;
}

.workspace-kicker {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.24em;
  color: #0f766e;
  text-transform: uppercase;
  white-space: nowrap;
}

.workspace-header h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
  color: #172033;
}

.workspace-tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #5d697f;
  text-align: right;
  white-space: normal;
  flex-shrink: 0;
}

.workspace-body {
  flex: 1;
  min-height: 0;
  overflow: visible;
}

.workspace-body .menu-content {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(0, 1.35fr);
  align-items: stretch;
  box-sizing: border-box;
  gap: 24px;
  min-width: 0;
  min-height: 0;
  overflow: visible;
}

.workspace-body .menu-content > div {
  width: 100%;
  min-height: 0;
  min-width: 0;
  padding: 60px 22px 22px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border: 1px solid rgba(25, 43, 75, 0.12);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 250, 252, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  position: relative;
  overflow: hidden;
}

.workspace-body .menu-content > div::before {
  position: absolute;
  top: 16px;
  left: 18px;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.workspace-body .left-content::before {
  content: "TEST MENU";
  color: #0f766e;
  background: rgba(20, 184, 166, 0.12);
}

.workspace-body .right-content::before {
  content: "TEST PAGE CONFIG";
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
}

.workspace-body .search-box {
  margin-bottom: 14px;
  flex-shrink: 0;
}

.workspace-body .input-box {
  width: 100%;
  margin-bottom: 0;
}

.workspace-body .search-box :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 14px;
  background: rgba(246, 248, 251, 0.92);
  box-shadow: inset 0 0 0 1px rgba(27, 43, 73, 0.08);
}

.workspace-body .search-box :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    inset 0 0 0 1px rgba(217, 119, 6, 0.45),
    0 0 0 4px rgba(217, 119, 6, 0.08);
}

.workspace-body .selection-summary {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-label {
  margin: 0 0 4px;
  font-size: 12px;
  color: #8a94a6;
}

.selection-summary strong {
  color: #172033;
  font-size: 15px;
}

.workspace-body .selection-summary :deep(.el-button) {
  min-height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  box-shadow: 0 10px 20px rgba(234, 88, 12, 0.18);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.workspace-body .menu-content > div :deep(.el-table) {
  flex: 1;
  width: 100%;
  min-height: 0;
  min-width: 0;
  height: auto !important;
  max-height: 100%;
  border: 1px solid rgba(28, 44, 75, 0.08);
  border-radius: 16px;
  overflow: auto;
  --el-table-header-bg-color: rgba(243, 246, 251, 0.96);
  --el-table-row-hover-bg-color: rgba(245, 158, 11, 0.08);
  --el-table-current-row-bg-color: rgba(14, 116, 144, 0.08);
  --el-table-border-color: rgba(28, 44, 75, 0.08);
  --el-table-header-text-color: #5c6475;
  --el-table-text-color: #1f2937;
  --el-fill-color-blank: transparent;
}

.workspace-body :deep(.el-table th) {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.workspace-body :deep(.el-table td) {
  padding-top: 10px;
  padding-bottom: 10px;
}

.workspace-body :deep(.el-table__empty-text) {
  color: #8a94a6;
  font-size: 15px;
}

.table-skeleton {
  flex: 1;
  min-height: 320px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(28, 44, 75, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(241, 245, 249, 0.78));
}

.skeleton-row {
  display: grid;
  align-items: center;
  gap: 14px;
}

.menu-skeleton-row {
  grid-template-columns: 1.2fr 1fr 88px;
}

.config-skeleton-row {
  grid-template-columns: 30px 1.2fr 1.35fr 90px 1fr;
}

.skeleton-block {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #e8edf4;
}

.skeleton-block::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.74), transparent);
  animation: skeleton-shimmer 1.1s ease-in-out infinite;
}

.skeleton-cell {
  height: 16px;
}

.skeleton-cell.checkbox {
  width: 18px;
  height: 18px;
  border-radius: 6px;
}

.skeleton-cell.short {
  width: 72px;
}

.skeleton-cell.medium {
  width: 66%;
}

.skeleton-cell.long {
  width: 82%;
}

.selection-hint {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #8a94a6;
}

.coming-soon-card {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 250, 252, 0.78));
  box-shadow: 0 18px 48px rgba(24, 39, 69, 0.08);
}

.coming-soon-kicker {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: #0f766e;
  text-transform: uppercase;
}

.coming-soon-copy h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.12;
  color: #172033;
}

.coming-soon-copy p:last-child {
  max-width: 620px;
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: #5d697f;
}

.coming-soon-tips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.coming-soon-tips span {
  padding: 7px 12px;
  border: 1px solid rgba(217, 119, 6, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: #b45309;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1200px) {
  .workspace-body .menu-content {
    grid-template-columns: 1fr;
  }

  .workspace-tip {
    text-align: left;
  }
}

@media (max-width: 960px) {
  .coming-soon-card,
  .workspace-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .coming-soon-tips {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .coming-soon-card,
  .workspace-card {
    min-height: auto;
    padding: 18px;
    border-radius: 20px;
  }

  .coming-soon-copy h2,
  .workspace-header h2 {
    font-size: 24px;
  }

  .workspace-body .menu-content > div {
    padding: 56px 14px 14px;
    border-radius: 20px;
  }

  .workspace-body .selection-summary {
    align-items: flex-start;
  }

  .workspace-body .selection-summary :deep(.el-button) {
    width: 100%;
  }

  .menu-skeleton-row,
  .config-skeleton-row {
    grid-template-columns: 1fr;
  }

  .skeleton-cell.short,
  .skeleton-cell.medium,
  .skeleton-cell.long {
    width: 100%;
  }
}
</style>
