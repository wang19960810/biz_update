<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from "vue-router"
import {useServeStore} from "@src/store/serveStoreState.ts";

const serveStore = useServeStore()

/**
 * 进入 biz-tools 时同步校准一次环境配置。
 * 这里不放到 onMounted，避免子组件 mounted 期间先触发业务请求。
 */
if (!serveStore.serveInfo) {
  serveStore.hydrateServeInfoFromCache()
}

const resolveTransitionName = (route: RouteLocationNormalizedLoaded) => {
  return typeof route.meta.transition === "string" ? route.meta.transition : "route-fade"
}

const resolvePageViewKey = (route: RouteLocationNormalizedLoaded) => {
  /**
   * system-config 是单页面工作台，内部通过 query 切换模块和子 tab。
   * 这里如果继续使用 fullPath 作为 key，会导致 query 变化时整页重新挂载，
   * 从而让“新增菜单 / 更新页面数据”切换出现明显卡顿。
   */
  if (route.name === "biz-tools-system-config") {
    return route.path
  }

  return route.fullPath
}
</script>

<template>
  <div class="biz-tools-shell">
    <router-view v-slot="{ Component, route }">
      <transition :name="resolveTransitionName(route)">
        <component :is="Component" :key="resolvePageViewKey(route)" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped lang="less">
.biz-tools-shell {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}
</style>
