<script setup lang="ts">

</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="slide-fade">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style scoped>

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-leave {
  transform: translateX(-1920px);
  opacity: 0.5;
}
.slide-fade-enter {
  transform: translateX(1920px);
  opacity: 0.5;
}
</style>
