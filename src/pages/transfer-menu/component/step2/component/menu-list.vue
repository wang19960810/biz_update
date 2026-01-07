<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMenuStore, usePageConfigStore, useDataViewStore, useDictCodeStore, usePageButtonStore, useTransferMenuGlobalStore } from "@src/store/transfer-menu";
import {ElMessage, type TreeInstance} from 'element-plus'
import type {MenuItem, PageConfig} from "../../../types/index.d.ts";

const menuStore = useMenuStore()

const pageConfigStore = usePageConfigStore()

const dataViewStore = useDataViewStore()

const dictCodeStore = useDictCodeStore()

const pageButtonStore = usePageButtonStore()

const transferMenuGlobalStore = useTransferMenuGlobalStore()

// 测试菜单实例
const testMenuRef = ref<TreeInstance>()

// 正式菜单 实例
const proMenuRef = ref<TreeInstance>()

// 测试菜单查询字段
const testSearchMenuName = ref<string>('')

// 正式环境查询字段
const proSearchMenuName = ref<string>('')

/**
 * 选择菜单
 * @param value 选择的数据
 * @param key
 */
const selectRow = (value: MenuItem[], key: string) => {
  console.log(value)
  menuStore[key] = JSON.parse(JSON.stringify(value))
}

/**
 * 更新页面配置
 */
const beforeUpDatePageConfig = async () => {
  dictCodeStore.dictCodesUpdatable = []
  transferMenuGlobalStore.loading = true
  await pageConfigStore.getPageConfigByMenu(menuStore.selectedMenu, {pageConfig: true})

  console.group('开始新增页面配置 ============>')
  const allRequestsForUpdatingThePageConfig = pageConfigStore.addedPageConfigs.map(async (item: PageConfig) => {
    return await pageConfigStore.startUpdatePageConfig(item)
  })
  await Promise.allSettled([...allRequestsForUpdatingThePageConfig])
  console.groupEnd()

  console.group('开始更新页面配置详情 ============>')
  const requestAll = pageConfigStore.updatablePageConfigs.map(async (item: any) => {
      return await pageConfigStore.getPageConfigOption(item, true)
  })
  await Promise.allSettled([...requestAll])
  console.groupEnd()
  transferMenuGlobalStore.loading = false
}

/**
 * 同步菜单信息
 */
const beforeUpDateMenuToTest = (env: 'test' | 'prod') => {
  // if(!menuStore.selectedMenu.length) return ElMessage.info("请选择需要同步的菜单！")
 menuStore.syncMenuEnvironment(env)

}

watch(testSearchMenuName, (val) => {
  testMenuRef.value!.filter(val)
})
watch(proSearchMenuName, (val) => {
  proMenuRef.value!.filter(val)
})

</script>

<template>

  <div class="menu-content" v-loading="transferMenuGlobalStore.loading">
    <div class="left-content">
      <div class="search-box">
        <el-input class="input-box" type="text" v-model="testSearchMenuName"  placeholder="请输入菜单名称"></el-input>
      </div>
      <div class="table-headers">
        <el-button type="primary" @click="beforeUpDateMenuToTest('test')">同步正式菜单</el-button>
      </div>

      <el-table
          @select="(value:MenuItem[]) => selectRow(value, 'selectedMenuTest')"
          :data="menuStore.menuListDataTest"
          :tree-props="{checkStrictly: false}"
          row-key="id"
          ref="testMenuRef"
      >
        <el-table-column type="selection" width="55"  />
        <el-table-column prop="comment" label="菜单名称"/>
        <el-table-column prop="code" label="菜单编码"/>
        <el-table-column prop="tstatus" label="启禁用">
          <template #default="scope">
            {{ scope.row.tstatus === 1 ? "启用" : "禁用" }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="right-content">
      <div class="search-box">
        <el-input class="input-box" type="text" v-model="proSearchMenuName"  placeholder="请输入菜单名称"></el-input>
      </div>
      <div class="table-headers">
        <el-button type="primary" @click="dataViewStore.beforeUpDateDataViewByMenu()">同步数据视图</el-button>
        <el-button type="primary" @click="beforeUpDatePageConfig()">同步页面配置</el-button>
        <el-button type="primary" @click="dictCodeStore.beforeUpdateDictCodes('update')">同步数据字典</el-button>
        <el-button type="primary" @click="pageButtonStore.beforeUpDatePageButton('update')">同步按钮</el-button>
        <el-button type="primary" @click="beforeUpDateMenuToTest('prod')">同步测试菜单</el-button>
      </div>

      <el-table
          @select="(value:MenuItem[]) => selectRow(value, 'selectedMenu')"
          :data="menuStore.menuListPro"
          :tree-props="{checkStrictly: false}"
          row-key="id"
          ref="proMenuRef"
      >
        <el-table-column type="selection" width="55"  />
        <el-table-column prop="comment" label="菜单名称"/>
        <el-table-column prop="code" label="菜单编码"/>
        <el-table-column prop="tstatus" label="启禁用">
          <template #default="scope">
            {{ scope.row.tstatus === 1 ? "启用" : "禁用" }}
          </template>
        </el-table-column>
      </el-table>
    </div>

  </div>
</template>

<style scoped lang="less">
.menu-content {
  display: flex;
  justify-content: space-between;
  .table-headers{
    display: flex;
    align-items: center;
    margin: 20rpx 0 10px;
    .el-button{
      margin-right: 10px;
    }
  }
  > div {
    width: 45%;
    text-align: left;
    flex-shrink: 0;
    .input-box {
      width: 300px;
      margin-bottom: 20px;
    }

    .el-table {
      height: 60vh;
      overflow: auto;
    }
  }
}
</style>