<script setup lang="ts">
import { useRouter } from "vue-router";
import { systemConfigMenuList, type SystemConfigMenuItem } from "../system-config/config";

const router = useRouter()

/**
 * 首页入口菜单和单页面头部菜单共用一套配置。
 * 点击后统一进入 system-config 页面，再按 view 参数匹配到具体单页面组件。
 */
const menuChild: SystemConfigMenuItem[] = systemConfigMenuList

/**
 * 跳转到系统配置单页面入口，并带上当前菜单对应的视图标识。
 */
const goPage = (menu: SystemConfigMenuItem) => {
  router.push({
    name: 'biz-tools-system-config',
    query: {
      view: menu.view
    }
  })
}

</script>

<template>
  <div class="home-page">
    <div class="box-container">
      <div class="box">
        <p class="title">菜单管理</p>
        <div class="button_box">
          <div class="icon_button" v-for="(menu, index) in menuChild" :key="index" @click="goPage(menu)"><img :src="menu.icon" :alt="menu.name"><span>{{ menu.name }}</span></div>
        </div>
      </div>
      <div class="box">
        <p class="title">数据视图</p>
<!--        <p class="describe">支持一键 <a>新增菜单</a> <a>同步菜单</a> ， 或通过菜单<a>同步数据视图</a> <a>同步页面配置</a> <a>同步页面按钮</a></p>-->
      </div>
      <div class="box">
        <p class="title">页面配置</p>
<!--        <p class="describe">支持一键 <a>新增菜单</a> <a>同步菜单</a> ， 或通过菜单<a>同步数据视图</a> <a>同步页面配置</a> <a>同步页面按钮</a></p>-->
      </div>
      <div class="box">
        <p class="title">按钮配置</p>
<!--        <p class="describe">支持一键 <a>新增菜单</a> <a>同步菜单</a> ， 或通过菜单<a>同步数据视图</a> <a>同步页面配置</a> <a>同步页面按钮</a></p>-->
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
  .home-page{
    width: 100%;
    min-height: 100vh;
    background: url("@src/assets/images/home-bg.png")no-repeat center center;
    background-size: cover;
    overflow: hidden;
    box-sizing: border-box;
  }
  .box-container{
    width: min(88%, 1680px);
    min-height: 82vh;
    margin: 0 auto;
    padding: 8vh 0 6vh;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, minmax(360px, 1fr));
    gap: 64px 72px;
  }
  .box{
    min-height: 360px;
    padding: 64px;
    box-sizing: border-box;
    background-color: rgba(255,255,255, 0.5);
    border-radius: 10px;
    border: 1px solid #fff;
    text-align: left;
    .title{
      font-size: 34px;
      font-weight: 600;

    }
    .button_box{
      display: grid;
      min-height: 240px;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, auto);
      margin-top: 54px;
      gap: 30px 34px;
      .icon_button {
        min-height: 118px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(255,255,255, 0.5);
        &:hover{
          cursor: pointer;
        }
        img{
          width: 56px;
          height: 56px;
        }
      }

    }

  }

  @media (max-width: 1280px) {
    .box-container {
      width: min(92%, 1080px);
      grid-template-columns: 1fr;
      grid-template-rows: repeat(4, minmax(220px, auto));
      gap: 28px;
    }
  }

  @media (max-width: 768px) {
    .home-page {
      overflow-y: auto;
    }

    .box-container {
      width: 92%;
      padding: 28px 0;
    }

    .box {
      padding: 28px;
    }

    .box .button_box {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
