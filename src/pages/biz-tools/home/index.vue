<script setup lang="ts">
import { useRouter } from "vue-router";
import { systemConfigMenuList,pageBuilderDescribeTag, type SystemConfigMenuItem } from "../system-config/config";
import { Plus } from '@element-plus/icons-vue'

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
        <p class="title">页面构建器</p>
        <p class="describe">这是一个基于现有标品规则的可视化开发环境，允许用户通过拖拽‘列表’与‘表单’组件，配置交互事件，并实时生成符合系统规范的前端代码</p>
        <div class="describe_tag">
          <div class="icon_tag" :class="tag.className" v-for="(tag, index) in pageBuilderDescribeTag" :key="index"><img :src="tag.icon" :alt="tag.name"><span>{{ tag.name }}</span></div>
        </div>
        <div class="button_box">
          <el-button type="primary" size="large" color="#333" :icon="Plus">开始构造</el-button>
          <div class="link-button">
            <text>查看教程</text>
            <img src="/src/assets/images/go-to.png" alt="向前">
          </div>
        </div>
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
    height: 100vh;
    background: url("@src/assets/images/home-bg.png")no-repeat center center;
    background-size: cover;
    overflow: hidden;
    box-sizing: border-box;
  }
  .box-container{
    width: min(88%, 1680px);
    height: 100%;
    margin: 0 auto;
    padding: 8vh 0 6vh;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 64px 72px;
  }
  .box{
    min-height: 360px;
    padding: 20px;
    box-sizing: border-box;
    background-color: rgba(255,255,255, 0.5);
    border-radius: 10px;
    border: 1px solid #fff;
    text-align: left;
    .title{
      font-size: 24px;
      font-weight: 600;
    }
    .describe{
      font-size: 14px;
      color: #555555;
      margin-top: 10px;
    }
    .button_box{
      display: grid;
      min-height: 240px;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, auto);
      margin-top: 20px;
      gap: 18px 34px;
      .icon_button {
        min-height: 118px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(255,255,255, 0.5);
        border-radius: 10px;
        &:hover{
          cursor: pointer;
        }
        img{
          width: 40px;
          height: 40px;
        }
      }
      .link-button{
        display: flex;
        align-items: center;
        height: 40px;
        cursor: pointer;
        img{
          width: 20px;
          height: 20px;
          margin-left: 10px;
        }
      }
    }
    .describe_tag{
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 30px 6px;
      margin: 30px 0;
      .icon_tag {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px 0;
        border-radius: 20px;
        border-style: solid;
        border-width: 1px;
        font-size: 14px;
        &.grey-tag{
          background-color: #f1f1f0;
          border-color: #e4e5e4;
          color: #333233;
        }
        &.green-tag{
          background-color: #f3f7fd;
          border-color: #e9f3fc;
          color: #1e76bb;
        }
        &.blue-tag{
          background-color: #f4f8f8;
          border-color: #eaf7f4;
          color: #1d9283;
        }
        img{
          width: 20px;
          height: 20px;
          margin-right: 5px;
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
