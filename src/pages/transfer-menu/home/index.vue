<script setup lang="ts">

const menuChild: [{name: string, icon: string, url: string}] = [
  {
    name: '添加菜单',
    icon: '/src/assets/images/add-menu.png',
    url: '',
  },{
    name: '同步菜单',
    icon: '/src/assets/images/update-menu.png',
    url: '',
  },{
    name: '同步数据视图',
    icon: '/src/assets/images/update-data-view.png',
    url: '',
  },{
    name: '同步页面配置',
    icon: '/src/assets/images/update-page-config.png',
    url: '',
  },{
    name: '同步页数据字典',
    icon: '/src/assets/images/update-data-dictionary.png',
    url: '',
  },{
    name: '同步页面按钮',
    icon: '/src/assets/images/update-button.png',
    url: '',
  },
]
</script>

<template>
  <div class="home-page">
    <div class="box-container">
      <div class="box">
        <p class="title">菜单管理</p>
        <div class="button_box">
          <div class="icon_button" v-for="(menu, index) in menuChild" :key="index"><img :src="menu.icon" :alt="menu.name"><span>{{ menu.name }}</span></div>
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
    min-height: 100vh;
    min-width: 100vw;
    background: url("@src/assets/images/home-bg.png")no-repeat center center;
    background-size: cover;
    overflow: hidden;
  }
  .box-container{
    padding: 5% 10% ;
    width: 80%;
    height: 80%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, auto);
    gap: 50px;
  }
  .box{
    padding: 40px;
    box-sizing: border-box;
    background-color: rgba(255,255,255, 0.5);
    border-radius: 10px;
    border: 1px solid #fff;
    text-align: left;
    .title{
      font-size: 28px;
      font-weight: 600;

    }
    .button_box{
      display: grid;
      height: 80%;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, auto);
      margin-top: 30px;
      gap: 20px;
      .icon_button {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(255,255,255, 0.5);
        img{
          width: 50px;
          height: 50px;
        }
      }

    }

  }
</style>