<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="coming-soon-card">
    <div class="coming-soon-copy">
      <p class="coming-soon-kicker">Coming Soon</p>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <div class="coming-soon-tips">
      <span>入口已接通</span>
      <span>组件待接入</span>
      <span>可直接扩展</span>
    </div>
  </section>
</template>

<style scoped lang="less">
.coming-soon-card {
  min-height: 360px;
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

@media (max-width: 960px) {
  .coming-soon-card {
    min-height: 280px;
    flex-direction: column;
    align-items: flex-start;
  }

  .coming-soon-tips {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .coming-soon-card {
    min-height: auto;
    padding: 18px;
    border-radius: 20px;
  }

  .coming-soon-copy h2 {
    font-size: 24px;
  }
}
</style>
