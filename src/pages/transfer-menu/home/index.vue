<script setup lang="ts">

</script>

<template>
  <div class="home-page">
    <div class="box-container">
      <div class="box">
        <p class="title">菜单管理</p>
        <p class="describe">支持一键 <a>新增菜单</a> <a>同步菜单</a> ， 或通过菜单<a>同步数据视图</a> <a>同步页面配置</a> <a>同步页面按钮</a></p>
      </div>
      <div class="box"></div>
      <div class="box"></div>
      <div class="box"></div>
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
    a {
      color: #9c4500;
    }
  }
</style>