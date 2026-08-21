<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref, watch } from 'vue'

import DictCodeCreatePanel from "./dict-code-create-panel.vue"
import DictCodeUpdatePanel from "./dict-code-update-panel.vue"

type DictCodeTab = 'add-dict' | 'update-dict'

type DictCodeTabItem = {
  key: DictCodeTab
  label: string
  description: string
}

const tabList: DictCodeTabItem[] = [
  {
    key: 'add-dict',
    label: '新增字典',
    description: '处理测试环境中新增的字典，并同步到正式环境。'
  },
  {
    key: 'update-dict',
    label: '更新字典',
    description: '查询测试环境字典并更新到正式环境。'
  }
]

const activeTab = ref<DictCodeTab>('add-dict')
const loadedTabs = ref<Record<DictCodeTab, boolean>>({
  'add-dict': true,
  'update-dict': false
})
const tabReady = ref<Record<DictCodeTab, boolean>>({
  'add-dict': false,
  'update-dict': false
})
const tabRenderLoading = ref(false)
let tabMountTimer: number | null = null
let tabLoadingFinishTimer: number | null = null

const activeTabMeta = computed(() => {
  return tabList.find(item => item.key === activeTab.value) || tabList[0]
})

const mountTabAfterPaint = (tab: DictCodeTab) => {
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

const handleTabReady = (tab: DictCodeTab) => {
  tabReady.value[tab] = true

  if (activeTab.value === tab) {
    finishTabLoading()
  }
}

const switchTab = (tab: DictCodeTab) => {
  if (tab === activeTab.value) {
    return
  }

  activeTab.value = tab
  tabRenderLoading.value = true
  mountTabAfterPaint(tab)
}

onMounted(() => {
  // 初始化
})

onBeforeUnmount(() => {
  if (tabMountTimer) {
    window.clearTimeout(tabMountTimer)
  }

  if (tabLoadingFinishTimer) {
    window.clearTimeout(tabLoadingFinishTimer)
  }
})
</script>

<template>
  <section class="dict-code-panel">
    <div class="panel-header">
      <div>
        <p class="panel-kicker">Dictionary Code</p>
        <h2>数据字典</h2>
      </div>
      <p class="panel-tip">
        查询测试环境数据字典并同步到正式环境。
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
        <div v-if="loadedTabs['add-dict']" v-show="activeTab === 'add-dict'">
          <DictCodeCreatePanel @render-ready="handleTabReady('add-dict')" />
        </div>

        <div v-if="loadedTabs['update-dict']" v-show="activeTab === 'update-dict'">
          <DictCodeUpdatePanel @render-ready="handleTabReady('update-dict')" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.dict-code-panel {
  min-height: 400px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.panel-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #ea580c;
}

.panel-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #172033;
}

.panel-tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #5d697f;
  max-width: 480px;
}

.panel-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(28, 44, 75, 0.08);
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
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: #1677ff;
    color: #1677ff;
  }

  &.is-active {
    border-color: #1677ff;
    background: #eff6ff;
    color: #1677ff;
  }
}

.panel-description {
  margin-bottom: 20px;
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  border-left: 3px solid #1677ff;
  background: #f8fafc;

  strong {
    font-size: 14px;
    font-weight: 600;
    color: #172033;
  }

  span {
    font-size: 13px;
    color: #5d697f;
  }
}

.tab-content {
  position: relative;
  min-height: 400px;
}

.tab-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.skeleton-card {
  padding: 24px;
  background: #fff;
  border-radius: 16px;
}

.skeleton-header {
  margin-bottom: 24px;
}

.skeleton-block {
  background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-kicker {
  width: 80px;
  height: 12px;
  margin-bottom: 8px;
}

.skeleton-title {
  width: 160px;
  height: 24px;
  margin-bottom: 16px;
}

.skeleton-copy {
  width: 70%;
  height: 14px;
}

.skeleton-toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.skeleton-button {
  width: 120px;
  height: 38px;
}

.skeleton-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.skeleton-cell {
  height: 20px;

  &.short {
    width: 15%;
  }

  &.medium {
    width: 25%;
  }

  &.long {
    width: 35%;
  }
}

.tab-pane-host {
  &.is-hidden {
    visibility: hidden;
    position: absolute;
    pointer-events: none;
  }
}

@media (max-width: 960px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-tip {
    max-width: none;
  }

  .panel-tabs {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
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
