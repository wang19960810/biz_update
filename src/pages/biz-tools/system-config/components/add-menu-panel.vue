<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useMenuStore } from "@src/store/transfer-menu";

const menuStore = useMenuStore()
const loading = ref(false)

import AddMenuCreatePanel from "./add-menu-create-panel.vue"
import PageConfigUpdatePanel from "./page-config-update-panel.vue"
import type { MenuSyncTab } from "../config"

const props = withDefaults(defineProps<{
  defaultTab?: MenuSyncTab
}>(), {
  defaultTab: 'add-menu'
})

type MenuSyncTabItem = {
  key: MenuSyncTab
  label: string
  description: string
}

const route = useRoute()
const router = useRouter()

/**
 * 菜单关联同步模块内部的两个业务子组件。
 * “新增菜单”负责新增菜单同步，“更新页面数据”负责联动更新页面数据。
 */
const tabList: MenuSyncTabItem[] = [
  {
    key: 'add-menu',
    label: '新增菜单',
    description: '处理测试环境中新增的菜单，并同步到正式环境。'
  },
  {
    key: 'page-data',
    label: '更新页面数据',
    description: '通过菜单同步页面配置、数据视图、数据字典与按钮数据。'
  }
]

const activeTab = ref<MenuSyncTab>(props.defaultTab)
const loadedTabs = ref<Record<MenuSyncTab, boolean>>({
  'add-menu': props.defaultTab === 'add-menu',
  'page-data': props.defaultTab === 'page-data'
})
const tabReady = ref<Record<MenuSyncTab, boolean>>({
  'add-menu': false,
  'page-data': false
})
const tabRenderLoading = ref(false)
let routeSyncTimer: number | null = null
let tabMountTimer: number | null = null
let tabLoadingFinishTimer: number | null = null

watch(() => props.defaultTab, (value) => {
  if (value !== activeTab.value) {
    activeTab.value = value
  }

  loadedTabs.value[value] = true
  if (!tabReady.value[value]) {
    tabRenderLoading.value = true
  }
})

const activeTabMeta = computed(() => {
  return tabList.find(item => item.key === activeTab.value) || tabList[0]
})

const syncRouteAfterRender = (tab: MenuSyncTab) => {
  if (routeSyncTimer) {
    window.clearTimeout(routeSyncTimer)
  }

  routeSyncTimer = window.setTimeout(() => {
    router.replace({
      path: route.path,
      query: {
        ...route.query,
        view: 'menu-sync',
        tab
      }
    })
  }, 0)
}

const mountTabAfterPaint = (tab: MenuSyncTab) => {
  if (loadedTabs.value[tab]) {
    if (tabReady.value[tab]) {
      finishTabLoading()
    }

    return
  }

  if (tabMountTimer) {
    window.clearTimeout(tabMountTimer)
  }

  tabMountTimer = window.setTimeout(() => {
    loadedTabs.value[tab] = true
    tabMountTimer = null
  }, 0)
}

const finishTabLoading = () => {
  if (tabLoadingFinishTimer) {
    window.clearTimeout(tabLoadingFinishTimer)
  }

  tabLoadingFinishTimer = window.setTimeout(() => {
    if (tabReady.value[activeTab.value]) {
      tabRenderLoading.value = false
    }

    tabLoadingFinishTimer = null
  }, 80)
}

/**
 * 子组件准备完成后，通知父层结束当前 tab 的 loading。
 */
const handleTabReady = (tab: MenuSyncTab) => {
  tabReady.value[tab] = true

  if (activeTab.value === tab) {
    finishTabLoading()
  }
}

/**
 * 内部切换子组件时同步更新路由参数。
 * 先切换按钮状态和说明区，再显示内容 loading，最后异步挂载目标组件。
 */
const switchTab = (tab: MenuSyncTab) => {
  if (tab === activeTab.value) {
    return
  }

  activeTab.value = tab
  tabRenderLoading.value = true
  mountTabAfterPaint(tab)
  syncRouteAfterRender(tab)
}


onMounted(async () => {
  await updateList()
})

/**
 * 拉取测试环境中可新增的菜单列表。
 */
const updateList = async () => {
  loading.value = true
  await menuStore.getUpdatedMenuList()
  loading.value = false
}

onBeforeUnmount(() => {
  if (routeSyncTimer) {
    window.clearTimeout(routeSyncTimer)
  }

  if (tabMountTimer) {
    window.clearTimeout(tabMountTimer)
  }

  if (tabLoadingFinishTimer) {
    window.clearTimeout(tabLoadingFinishTimer)
  }
})
</script>

<template>
  <section class="menu-sync-panel"  v-loading="loading">
    <div class="panel-header">
      <div>
        <p class="panel-kicker">Menu Sync</p>
        <h2>菜单关联同步</h2>
      </div>
      <p class="panel-tip">
        以菜单为入口处理两类操作：一类是新增菜单同步，另一类是关联页面数据的一键更新。
      </p>
    </div>

    <div class="panel-tabs">
      <button
        v-for="item in tabList"
        :key="item.key"
        type="button"
        class="tab-button"
        :class="{ 'is-active': item.key === activeTab }"
        @click="switchTab(item.key)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="panel-description">
      <strong>{{ activeTabMeta.label }}</strong>
      <span>{{ activeTabMeta.description }}</span>
    </div>

    <div class="tab-content">
      <div v-if="tabRenderLoading" class="tab-skeleton">
        <div class="skeleton-card">
          <div class="skeleton-header">
            <div class="skeleton-block skeleton-kicker"></div>
            <div class="skeleton-block skeleton-title"></div>
            <div class="skeleton-block skeleton-copy"></div>
          </div>

          <div class="skeleton-toolbar">
            <div class="skeleton-block skeleton-button"></div>
          </div>

          <div class="skeleton-table">
            <div class="skeleton-row" v-for="item in 6" :key="item">
              <div class="skeleton-block skeleton-cell short"></div>
              <div class="skeleton-block skeleton-cell medium"></div>
              <div class="skeleton-block skeleton-cell long"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-pane-host" :class="{ 'is-hidden': tabRenderLoading }">
        <div v-if="loadedTabs['add-menu']" v-show="activeTab === 'add-menu'">
        <AddMenuCreatePanel @render-ready="handleTabReady('add-menu')" />
        </div>

        <div v-if="loadedTabs['page-data']" v-show="activeTab === 'page-data'">
          <PageConfigUpdatePanel @render-ready="handleTabReady('page-data')" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.menu-sync-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-header {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #fff;
}

.panel-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #0f766e;
  text-transform: uppercase;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  color: #172033;
}

.panel-tip {
  max-width: 560px;
  margin: 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
  text-align: right;
}

.panel-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tab-button {
  min-width: 120px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  color: #344054;
  font-size: 13px;
  font-weight: 700;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.tab-button:hover {
  cursor: pointer;
  border-color: #1677ff;
  color: #1677ff;
}

.tab-button.is-active {
  border-color: #1677ff;
  background: #eff6ff;
  color: #1677ff;
}

.panel-description {
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  border-left: 3px solid #1677ff;
  background: #f8fafc;
}

.panel-description strong {
  color: #172033;
  font-size: 14px;
  line-height: 1.5;
}

.panel-description span {
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
}

.tab-content {
  position: relative;
  min-height: 240px;
}

.tab-pane-host.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.tab-skeleton {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.skeleton-card {
  min-height: 520px;
  padding: 20px 22px 22px;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #fff;
}

.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-toolbar {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
}

.skeleton-table {
  margin-top: 22px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafbfc;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 90px 1fr 1.2fr;
  gap: 18px;
  padding: 12px 0;
}

.skeleton-block {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #e9eef5;
}

.skeleton-block::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  animation: skeleton-shimmer 1.1s ease-in-out infinite;
}

.skeleton-kicker {
  width: 96px;
  height: 14px;
}

.skeleton-title {
  width: 180px;
  height: 30px;
}

.skeleton-copy {
  width: min(540px, 92%);
  height: 16px;
}

.skeleton-button {
  width: 132px;
  height: 36px;
}

.skeleton-cell {
  height: 16px;
}

.skeleton-cell.short {
  width: 72px;
}

.skeleton-cell.medium {
  width: 58%;
}

.skeleton-cell.long {
  width: 82%;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 960px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-tip {
    max-width: none;
    text-align: left;
  }
}

@media (max-width: 768px) {
  .panel-header {
    padding: 16px;
  }

  .skeleton-card {
    min-height: 420px;
    padding: 16px;
  }

  .skeleton-toolbar {
    justify-content: flex-start;
  }

  .skeleton-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tab-button {
    flex: 1 1 calc(50% - 10px);
  }
}

@media (max-width: 560px) {
  .tab-button {
    flex-basis: 100%;
  }
}
</style>
