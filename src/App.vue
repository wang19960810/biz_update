<script setup lang="ts">

</script>

<template>
  <router-view v-slot="{ Component }" class="positon-router">
    <transition name="slide-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style scoped>
.positon-router{
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
.v-enter-active, .v-leave-active {
  transition: all 0.5s ease;
}
.v-enter, .v-leave-to{
  opacity: 0.2;
  transform:translateX(100%);
}

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.8s ease;
}

.slide-fade-leave-to{
  opacity: 0.2;
  transform:translateX(-100%);
}
</style>
