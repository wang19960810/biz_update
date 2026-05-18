<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from "vue-router"

const resolveTransitionName = (route: RouteLocationNormalizedLoaded) => {
  return typeof route.meta.transition === "string" ? route.meta.transition : "route-fade"
}

const resolveAppViewKey = (route: RouteLocationNormalizedLoaded) => {
  return route.matched[0]?.path ?? route.fullPath
}
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="resolveTransitionName(route)">
      <component :is="Component" :key="resolveAppViewKey(route)" />
    </transition>
  </router-view>
</template>
