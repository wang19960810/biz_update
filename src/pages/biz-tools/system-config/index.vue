<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AddMenuPanel from "./components/add-menu-panel.vue"
import ComingSoonPanel from "./components/coming-soon-panel.vue"
import {
  resolveMenuSyncTab,
  resolveSystemConfigMenuItem,
  resolveSystemConfigView,
  systemConfigMenuList,
  type MenuSyncTab,
  type SystemConfigMenuItem,
  type SystemConfigView
} from "./config"

type SystemConfigPanelConfig = {
  component: Component
  props?: Record<string, unknown>
}

const route = useRoute()
const router = useRouter()

/**
 * 所有系统配置入口统一走这一份菜单配置。
 * 顶部菜单和首页入口保持同源，避免后续出现显示名称和路由参数不一致。
 */
const headerMenus: SystemConfigMenuItem[] = systemConfigMenuList

/**
 * 当前选中的一级模块。
 */
const activeView = computed<SystemConfigView>(() => resolveSystemConfigView(route.query.view))

/**
 * 当前选中的菜单关联同步子视图。
 * 只有 menu-sync 模块会使用这个参数。
 */
const activeMenuSyncTab = computed<MenuSyncTab>(() => resolveMenuSyncTab(route.query.tab))

/**
 * 通过路由参数反查当前高亮的顶部菜单项。
 */
const activeMenu = computed(() => {
  return resolveSystemConfigMenuItem(activeView.value, activeMenuSyncTab.value)
})

/**
 * 一级模块和实际渲染组件的映射表。
 * 菜单关联同步模块内部再通过 tab 参数切换“新增菜单 / 更新页面数据”。
 */
const panelComponentMap: Record<SystemConfigView, SystemConfigPanelConfig> = {
  'menu-sync': {
    component: AddMenuPanel
  },
  'data-view': {
    component: ComingSoonPanel,
    props: {
      title: "数据视图",
      description: "当前先保留页面入口和映射逻辑，后续接入真实业务组件后会直接在这里承载。"
    }
  },
  'page-layout': {
    component: ComingSoonPanel,
    props: {
      title: "页面配置",
      description: "当前先保留页面入口和映射逻辑，后续接入真实业务组件后会直接在这里承载。"
    }
  },
  'dict-code': {
    component: ComingSoonPanel,
    props: {
      title: "数据字典",
      description: "当前先保留页面入口和映射逻辑，后续接入真实业务组件后会直接在这里承载。"
    }
  },
  'page-button': {
    component: ComingSoonPanel,
    props: {
      title: "页面按钮",
      description: "当前先保留页面入口和映射逻辑，后续接入真实业务组件后会直接在这里承载。"
    }
  }
}

/**
 * 当前需要渲染的业务组件。
 */
const activePanel = computed(() => {
  if (activeView.value === 'menu-sync') {
    return {
      ...panelComponentMap['menu-sync'],
      props: {
        defaultTab: activeMenuSyncTab.value
      }
    }
  }

  return panelComponentMap[activeView.value]
})

/**
 * 切换顶部菜单时统一写入 view / tab。
 * 这样首页入口、顶部菜单和业务子视图都能通过路由参数保持一致。
 */
const switchView = (menu: SystemConfigMenuItem) => {
  if (menu.key === activeMenu.value.key) {
    return
  }

  router.replace({
    name: 'biz-tools-system-config',
    query: {
      view: menu.view,
      ...(menu.tab ? { tab: menu.tab } : {})
    }
  })
}
</script>

<template>
  <div class="system-config-page">
    <section class="page-toolbar">
      <div class="toolbar-copy">
        <h1>系统配置同步</h1>
        <p>
          通过菜单入口处理新增菜单和关联页面数据同步。顶部菜单只负责切换模块，页面主体直接承载业务操作。
        </p>
      </div>

      <div class="toolbar-actions">
        <button
          v-for="menu in headerMenus"
          :key="menu.key"
          type="button"
          class="toolbar-button"
          :class="{
            'is-active': menu.key === activeMenu.key,
            'is-placeholder': !menu.implemented
          }"
          @click="switchView(menu)"
        >
          <img :src="menu.icon" :alt="menu.name">
          <span>{{ menu.name }}</span>
        </button>
      </div>
    </section>

    <div class="page-content">
      <keep-alive>
        <component :is="activePanel.component" v-bind="activePanel.props" />
      </keep-alive>
    </div>
  </div>
</template>

<style scoped lang="less">
.system-config-page {
  min-height: 100%;
  box-sizing: border-box;
  padding: 20px 24px 24px;
  background: #f5f7fa;
  color: #172033;
}

.page-toolbar {
  margin-bottom: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #fff;
}

.toolbar-copy h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.toolbar-copy p {
  max-width: 720px;
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.55;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.toolbar-button {
  height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  color: #344054;
  font-size: 13px;
  font-weight: 700;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.toolbar-button:hover {
  cursor: pointer;
  border-color: #1677ff;
  color: #1677ff;
}

.toolbar-button.is-active {
  border-color: #1677ff;
  background: #eff6ff;
  color: #1677ff;
}

.toolbar-button.is-placeholder {
  border-style: dashed;
}

.toolbar-button img {
  width: 16px;
  height: 16px;
}

.page-content {
  min-height: 0;
}

@media (max-width: 1280px) {
  .page-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .system-config-page {
    padding: 16px;
  }

  .page-toolbar {
    padding: 16px;
  }

  .toolbar-copy h1 {
    font-size: 22px;
  }

  .toolbar-button {
    flex: 1 1 calc(50% - 10px);
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .toolbar-button {
    flex-basis: 100%;
  }
}
</style>
