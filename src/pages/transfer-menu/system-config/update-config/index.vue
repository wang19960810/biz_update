<script setup lang="ts">
import MenuList from "../../component/step2/component/menu-list.vue";

const guideCards = [
  {
    title: "双环境对照",
    description: "左侧保留测试环境菜单树，右侧承接正式环境同步动作，操作路径更清晰。"
  },
  {
    title: "树形筛选",
    description: "通过菜单名称或编码快速定位节点，搜索结果只影响当前页面展示，不污染原始数据。"
  },
  {
    title: "批量同步",
    description: "围绕菜单入口串起数据视图、页面配置、数据字典与按钮能力，一屏完成更新。"
  }
]
</script>

<template>
  <div class="update-config-page">
    <div class="background-orb orb-left"></div>
    <div class="background-orb orb-right"></div>

    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">SYNC WORKSPACE</p>
        <h1>菜单同步控制台</h1>
        <p class="hero-text">
          面向测试环境与正式环境的菜单差异处理界面。先检索，再勾选，再一键同步关联配置，整个过程保持在同一视图里完成。
        </p>
      </div>
      <div class="hero-tags">
        <span>菜单搜索</span>
        <span>环境对照</span>
        <span>关联同步</span>
      </div>
    </section>

    <section class="guide-grid">
      <article v-for="item in guideCards" :key="item.title" class="guide-card">
        <p class="guide-index">0{{ guideCards.indexOf(item) + 1 }}</p>
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </article>
    </section>

    <section class="workspace-card">
      <div class="workspace-header">
        <div>
          <p class="workspace-kicker">Live Compare</p>
          <h2>菜单与配置同步面板</h2>
        </div>
        <p class="workspace-tip">
          左侧用于筛选测试环境菜单，右侧用于同步正式环境的菜单与相关配置。
        </p>
      </div>

      <div class="workspace-body">
        <MenuList />
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
.update-config-page {
  --accent: #d97706;
  --accent-strong: #b45309;
  --ink: #172033;
  --muted: #5d697f;
  --line: rgba(25, 43, 75, 0.12);
  --panel: rgba(255, 252, 246, 0.8);
  --panel-strong: rgba(255, 255, 255, 0.92);
  height: 100vh;
  box-sizing: border-box;
  padding: 22px 26px 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 28%),
    radial-gradient(circle at 85% 12%, rgba(14, 116, 144, 0.16), transparent 24%),
    linear-gradient(135deg, #f5efe2 0%, #f7f8fb 48%, #eef4f8 100%);
  color: var(--ink);
  font-family: "Avenir Next", "Segoe UI", "PingFang SC", sans-serif;
}

.background-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(6px);
  opacity: 0.6;
  pointer-events: none;
}

.orb-left {
  top: 80px;
  left: -90px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(217, 119, 6, 0.2), transparent 70%);
}

.orb-right {
  right: -60px;
  bottom: 140px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(14, 116, 144, 0.2), transparent 70%);
}

.hero-panel,
.guide-card,
.workspace-card {
  position: relative;
  z-index: 1;
}

.hero-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 26px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(255, 250, 240, 0.88), rgba(255, 255, 255, 0.72));
  box-shadow: 0 24px 60px rgba(80, 61, 18, 0.12);
  backdrop-filter: blur(16px);
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--accent-strong);
  white-space: nowrap;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(28px, 3.2vw, 46px);
  line-height: 1.02;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.hero-text {
  max-width: none;
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: var(--muted);
}

.hero-tags {
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.hero-tags span {
  padding: 9px 14px;
  border: 1px solid rgba(217, 119, 6, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
  flex-shrink: 0;
}

.guide-card {
  padding: 16px 18px 14px;
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(252, 247, 238, 0.76));
  box-shadow: 0 18px 42px rgba(20, 38, 64, 0.08);
  animation: rise-in 0.55s ease both;
}

.guide-card:nth-child(2) {
  animation-delay: 0.08s;
}

.guide-card:nth-child(3) {
  animation-delay: 0.16s;
}

.guide-index {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: rgba(180, 83, 9, 0.58);
  white-space: nowrap;
}

.guide-card h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.guide-card p:last-child {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.55;
  font-size: 13px;
}

.workspace-card {
  margin-top: 16px;
  padding: 20px 20px 18px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(247, 250, 252, 0.78));
  box-shadow: 0 26px 80px rgba(24, 39, 69, 0.12);
  backdrop-filter: blur(18px);
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  flex-shrink: 0;
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
  white-space: nowrap;
}

.workspace-tip {
  max-width: none;
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--muted);
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
}

.workspace-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.workspace-body :deep(.menu-content) {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  gap: 26px;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
}

.workspace-body :deep(.menu-content > div) {
  width: auto;
  height: 100%;
  min-height: 0;
  padding: 58px 18px 14px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border: 1px solid var(--line);
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 250, 252, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 22px 48px rgba(21, 36, 60, 0.08);
  position: relative;
  overflow: hidden;
}

.workspace-body :deep(.left-content) {
  flex: 0 1 420px;
  min-width: 420px;
}

.workspace-body :deep(.right-content) {
  flex: 1 1 auto;
  min-width: 0;
}

.workspace-body :deep(.menu-content > div)::before {
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

.workspace-body :deep(.left-content)::before {
  content: "TEST";
  color: #0f766e;
  background: rgba(20, 184, 166, 0.12);
}

.workspace-body :deep(.right-content)::before {
  content: "PROD";
  color: var(--accent-strong);
  background: rgba(245, 158, 11, 0.12);
}

.workspace-body :deep(.search-box) {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.workspace-body :deep(.input-box) {
  width: 100%;
  margin-bottom: 0;
}

.workspace-body :deep(.search-box .el-input__wrapper) {
  min-height: 42px;
  border-radius: 14px;
  background: rgba(246, 248, 251, 0.92);
  box-shadow: inset 0 0 0 1px rgba(27, 43, 73, 0.08);
}

.workspace-body :deep(.search-box .el-input__wrapper.is-focus) {
  box-shadow:
    inset 0 0 0 1px rgba(217, 119, 6, 0.45),
    0 0 0 4px rgba(217, 119, 6, 0.08);
}

.workspace-body :deep(.search-box .el-input__inner) {
  font-size: 13px;
}

.workspace-body :deep(.table-headers) {
  flex-wrap: nowrap;
  gap: 8px;
  margin: 0 0 10px;
  flex-shrink: 0;
  overflow: hidden;
}

.workspace-body :deep(.table-headers .el-button) {
  margin-right: 0;
  min-height: 38px;
  padding: 0 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  box-shadow: 0 12px 22px rgba(234, 88, 12, 0.2);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.workspace-body :deep(.table-headers .el-button:hover) {
  transform: translateY(-1px);
  filter: saturate(1.05);
}

.workspace-body :deep(.menu-content > div .el-table) {
  flex: 1;
  min-height: 0;
  height: auto !important;
  max-height: 100%;
  border: 1px solid rgba(28, 44, 75, 0.08);
  border-radius: 16px;
  overflow: hidden;
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

.workspace-body :deep(.el-table .cell) {
  line-height: 1.35;
}

.workspace-body :deep(.el-table__empty-text) {
  color: #8a94a6;
  font-size: 15px;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1280px) {
  .update-config-page {
    height: auto;
    overflow: visible;
  }

  .hero-panel,
  .workspace-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-tags,
  .workspace-tip {
    justify-content: flex-start;
    text-align: left;
  }

  .guide-grid {
    grid-template-columns: 1fr;
  }

  .workspace-body :deep(.menu-content) {
    flex-direction: column;
  }

  .workspace-body :deep(.menu-content > div) {
    width: 100%;
    height: auto;
    min-height: auto;
  }

  .workspace-body :deep(.left-content),
  .workspace-body :deep(.right-content) {
    flex: none;
    min-width: 100%;
  }

  .workspace-body :deep(.el-table) {
    height: 58vh;
    min-height: 58vh;
    flex: none;
  }
}

@media (max-width: 768px) {
  .update-config-page {
    padding: 18px 14px 24px;
  }

  .hero-panel,
  .workspace-card {
    padding: 18px;
    border-radius: 20px;
  }

  .workspace-body :deep(.menu-content > div) {
    padding: 58px 14px 14px;
    border-radius: 20px;
  }

  .hero-copy h1,
  .workspace-header h2,
  .workspace-tip {
    white-space: normal;
  }

  .hero-tags,
  .workspace-body :deep(.table-headers) {
    flex-wrap: wrap;
  }

  .workspace-body :deep(.table-headers .el-button) {
    width: 100%;
  }
}
</style>
