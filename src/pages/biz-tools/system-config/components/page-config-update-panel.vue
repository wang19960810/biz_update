<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  useMenuStore,
  usePageConfigStore,
  useDataViewStore,
  useDictCodeStore,
  usePageButtonStore,
  useTransferMenuGlobalStore
} from "@src/store/transfer-menu";
import type { MenuItem, PageConfig } from "../../types/index.d.ts";

const emit = defineEmits<{
  (event: 'render-ready'): void
}>()

const menuStore = useMenuStore()
const pageConfigStore = usePageConfigStore()
const dataViewStore = useDataViewStore()
const dictCodeStore = useDictCodeStore()
const pageButtonStore = usePageButtonStore()
const transferMenuGlobalStore = useTransferMenuGlobalStore()

const testSearchMenuName = ref<string>('')
const proSearchMenuName = ref<string>('')
const testPaneReady = ref(false)
const prodPaneReady = ref(false)
const emittedReady = ref(false)
const workspaceBodyRef = ref<HTMLElement | null>(null)
const testTableRef = ref<any>(null)
const prodTableRef = ref<any>(null)
let testPaneTimer: number | null = null
let prodPaneTimer: number | null = null
let tableLayoutFrame: number | null = null
let resizeObserver: ResizeObserver | null = null

const normalizeKeyword = (value: string) => value.trim().toLowerCase()

const menuMatchesKeyword = (menu: MenuItem, keyword: string) => {
  return [menu.comment, menu.code]
    .filter(Boolean)
    .some(item => item.toLowerCase().includes(keyword))
}

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

const testMenuList = computed(() => filterMenuTree(menuStore.menuListDataTest, testSearchMenuName.value))
const proMenuList = computed(() => filterMenuTree(menuStore.menuListPro, proSearchMenuName.value))

/**
 * 勾选菜单后，将选中结果写回全局 store。
 * 后续页面配置、数据视图、数据字典和按钮同步都依赖这里的选中菜单。
 */
const selectRow = (value: MenuItem[], key: 'selectedMenu' | 'selectedMenuTest') => {
  menuStore[key] = JSON.parse(JSON.stringify(value))
}

/**
 * 根据正式环境选中的菜单，同步页面配置数据。
 */
const beforeUpDatePageConfig = async () => {
  dictCodeStore.dictCodesUpdatable = []
  transferMenuGlobalStore.loading = true
  await pageConfigStore.getPageConfigByMenu(menuStore.selectedMenu, { pageConfig: true })

  console.group('开始新增页面配置============>')
  const allRequestsForUpdatingThePageConfig = pageConfigStore.addedPageConfigs.map(async (item: PageConfig) => {
    return await pageConfigStore.startUpdatePageConfig(item)
  })
  await Promise.allSettled([...allRequestsForUpdatingThePageConfig])
  console.groupEnd()

  console.group('开始更新页面配置详情============>')
  const requestAll = pageConfigStore.updatablePageConfigs.map(async (item: any) => {
    return await pageConfigStore.getPageConfigOption(item, true)
  })
  await Promise.allSettled([...requestAll])
  console.groupEnd()
  transferMenuGlobalStore.loading = false
}

/**
 * 按环境刷新菜单数据。
 * test 表示将正式环境菜单同步到测试环境视图，prod 表示相反方向。
 */
const beforeUpDateMenuToTest = (env: 'test' | 'prod') => {
  menuStore.syncMenuEnvironment(env)
}

/**
 * el-table 在隐藏容器、尺寸变化或双栏切换后，列宽有时不会立刻重算。
 * 这里统一在下一帧主动触发 doLayout，避免右侧面板显示不全。
 */
const scheduleTableLayout = () => {
  if (tableLayoutFrame) {
    window.cancelAnimationFrame(tableLayoutFrame)
  }

  tableLayoutFrame = window.requestAnimationFrame(() => {
    testTableRef.value?.doLayout?.()
    prodTableRef.value?.doLayout?.()
    tableLayoutFrame = null
  })
}

/**
 * 页面数据面板首次切入时会同时渲染两棵树表，主线程压力比较大。
 * 这里改成延后渲染：先让按钮切换结果完成首帧绘制，再逐步挂载左右两张表。
 */
const warmUpPanes = () => {
  if (testPaneReady.value && prodPaneReady.value) {
    return
  }

  if (!testPaneReady.value && !testPaneTimer) {
    testPaneTimer = window.setTimeout(() => {
      testPaneReady.value = true
      testPaneTimer = null

      if (!prodPaneReady.value && !prodPaneTimer) {
        prodPaneTimer = window.setTimeout(() => {
          prodPaneReady.value = true
          prodPaneTimer = null
        }, 16)
      }
    }, 0)

    return
  }

  if (!prodPaneReady.value && !prodPaneTimer) {
    prodPaneTimer = window.setTimeout(() => {
      prodPaneReady.value = true
      prodPaneTimer = null
    }, 16)
  }
}

onMounted(() => {
  warmUpPanes()

  if (workspaceBodyRef.value) {
    resizeObserver = new ResizeObserver(() => {
      scheduleTableLayout()
    })
    resizeObserver.observe(workspaceBodyRef.value)
  }
})

onActivated(() => {
  warmUpPanes()
  nextTick(() => {
    scheduleTableLayout()
  })
})

watch(() => testPaneReady.value && prodPaneReady.value, (ready) => {
  if (ready && !emittedReady.value) {
    emittedReady.value = true
    emit('render-ready')
  }
}, {
  immediate: true
})

watch(
  () => [testPaneReady.value, prodPaneReady.value, testMenuList.value.length, proMenuList.value.length],
  () => {
    nextTick(() => {
      scheduleTableLayout()
    })
  },
  {
    flush: 'post'
  }
)

onBeforeUnmount(() => {
  if (testPaneTimer) {
    window.clearTimeout(testPaneTimer)
  }

  if (prodPaneTimer) {
    window.clearTimeout(prodPaneTimer)
  }

  if (tableLayoutFrame) {
    window.cancelAnimationFrame(tableLayoutFrame)
  }

  resizeObserver?.disconnect()
})
</script>

<template>
  <section class="workspace-card">
    <div class="workspace-header">
      <div>
        <p class="workspace-kicker">Page Data</p>
        <h2>更新页面数据</h2>
      </div>
      <p class="workspace-tip">
        以菜单为主索引，同步页面配置、数据视图、数据字典和按钮数据，适合做菜单关联数据的一键更新。
      </p>
    </div>

    <div ref="workspaceBodyRef" class="workspace-body" v-loading="transferMenuGlobalStore.loading">
      <div class="menu-content">
        <div class="left-content">
          <template v-if="testPaneReady">
            <div class="search-box">
              <el-input
                v-model="testSearchMenuName"
                class="input-box"
                type="text"
                placeholder="请输入菜单名称或编码"
              />
            </div>
            <div class="table-headers">
              <el-button type="primary" @click="beforeUpDateMenuToTest('test')">同步正式菜单</el-button>
            </div>

            <el-table
              ref="testTableRef"
              :data="testMenuList"
              :tree-props="{ checkStrictly: false }"
              row-key="id"
              :default-expand-all="Boolean(testSearchMenuName)"
              :empty-text="testSearchMenuName ? '暂无匹配菜单' : '暂无数据'"
              @selection-change="(value: MenuItem[]) => selectRow(value, 'selectedMenuTest')"
            >
              <el-table-column type="selection" width="55" :reserve-selection="true" />
              <el-table-column prop="comment" label="菜单名称" />
              <el-table-column prop="code" label="菜单编码" />
              <el-table-column prop="tstatus" label="启禁用">
                <template #default="scope">
                  {{ scope.row.tstatus === 1 ? "启用" : "禁用" }}
                </template>
              </el-table-column>
            </el-table>
          </template>
          <div v-else class="table-skeleton">
            <span>正在准备测试环境菜单...</span>
          </div>
        </div>

        <div class="right-content">
          <template v-if="prodPaneReady">
            <div class="search-box">
              <el-input
                v-model="proSearchMenuName"
                class="input-box"
                type="text"
                placeholder="请输入菜单名称或编码"
              />
            </div>
            <div class="table-headers">
              <el-button type="primary" @click="dataViewStore.beforeUpDateDataViewByMenu()">同步数据视图</el-button>
              <el-button type="primary" @click="beforeUpDatePageConfig()">同步页面配置</el-button>
              <el-button type="primary" @click="dictCodeStore.beforeUpdateDictCodes('update')">同步数据字典</el-button>
              <el-button type="primary" @click="pageButtonStore.beforeUpDatePageButton('update')">同步按钮</el-button>
              <el-button type="primary" @click="beforeUpDateMenuToTest('prod')">同步测试菜单</el-button>
            </div>

            <el-table
              ref="prodTableRef"
              :data="proMenuList"
              :tree-props="{ checkStrictly: false }"
              row-key="id"
              :default-expand-all="Boolean(proSearchMenuName)"
              :empty-text="proSearchMenuName ? '暂无匹配菜单' : '暂无数据'"
              @selection-change="(value: MenuItem[]) => selectRow(value, 'selectedMenu')"
            >
              <el-table-column type="selection" width="55" :reserve-selection="true" />
              <el-table-column prop="comment" label="菜单名称" />
              <el-table-column prop="code" label="菜单编码" />
              <el-table-column prop="tstatus" label="启禁用">
                <template #default="scope">
                  {{ scope.row.tstatus === 1 ? "启用" : "禁用" }}
                </template>
              </el-table-column>
            </el-table>
          </template>
          <div v-else class="table-skeleton">
            <span>正在准备正式环境菜单...</span>
          </div>
        </div>
      </div>
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  box-sizing: border-box;
  gap: 24px;
  min-width: 0;
  min-height: 0;
  overflow: visible;
}

.workspace-body .menu-content > div {
  width: 100%;
  height: auto;
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
  content: "TEST";
  color: #0f766e;
  background: rgba(20, 184, 166, 0.12);
}

.workspace-body .right-content::before {
  content: "PROD";
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
}

.workspace-body .search-box {
  margin-bottom: 10px;
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

.workspace-body .search-box :deep(.el-input__inner) {
  font-size: 13px;
}

.workspace-body .table-headers {
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 14px;
  flex-shrink: 0;
  min-height: 38px;
  display: flex;
  align-items: center;
}

.workspace-body .table-headers :deep(.el-button) {
  margin-right: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(148, 163, 184, 0.48);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.78));
  color: #64748b;
  font-size: 13px;
}

/**
 * 后台工作台场景下，1280 左右的宽度仍然需要优先保证双栏同时可见。
 * 这里先压缩间距和按钮尺寸，只在更窄的窗口中才切成单列。
 */
@media (max-width: 1400px) {
  .workspace-card {
    padding: 20px;
  }

  .workspace-body .menu-content {
    gap: 16px;
  }

  .workspace-body .menu-content > div {
    padding: 56px 16px 16px;
    border-radius: 18px;
  }

  .workspace-body .table-headers {
    gap: 10px;
  }

  .workspace-body .table-headers :deep(.el-button) {
    min-height: 36px;
    padding: 0 12px;
    font-size: 12px;
  }
}

@media (max-width: 1100px) {
  .workspace-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspace-tip {
    text-align: left;
  }

  .workspace-body .menu-content {
    grid-template-columns: 1fr;
  }

  .workspace-body .menu-content > div {
    width: 100%;
    height: auto;
    min-height: 420px;
  }

  .workspace-body .menu-content > div :deep(.el-table) {
    height: 58vh;
    min-height: 58vh;
    flex: none;
  }
}

@media (max-width: 768px) {
  .workspace-card {
    min-height: auto;
    padding: 18px;
    border-radius: 20px;
  }

  .workspace-body .menu-content > div {
    padding: 56px 14px 14px;
    border-radius: 20px;
  }

  .workspace-header h2,
  .workspace-tip {
    white-space: normal;
  }

  .workspace-body .table-headers :deep(.el-button) {
    width: 100%;
  }
}
</style>
