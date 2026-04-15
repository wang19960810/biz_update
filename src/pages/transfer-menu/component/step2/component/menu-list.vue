<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useMenuStore,
  usePageConfigStore,
  useDataViewStore,
  useDictCodeStore,
  usePageButtonStore,
  useTransferMenuGlobalStore
} from "@src/store/transfer-menu";
import type { MenuItem, PageConfig } from "../../../types/index.d.ts";

const menuStore = useMenuStore()

const pageConfigStore = usePageConfigStore()

const dataViewStore = useDataViewStore()

const dictCodeStore = useDictCodeStore()

const pageButtonStore = usePageButtonStore()

const transferMenuGlobalStore = useTransferMenuGlobalStore()

const testSearchMenuName = ref<string>('')

const proSearchMenuName = ref<string>('')

const normalizeKeyword = (value: string) => value.trim().toLowerCase()

const menuMatchesKeyword = (menu: MenuItem, keyword: string) => {
  return [menu.comment, menu.code]
    .filter(Boolean)
    .some(item => item.toLowerCase().includes(keyword))
}

const filterMenuTree = (menus: MenuItem[], keyword: string): MenuItem[] => {
  const normalizedKeyword = normalizeKeyword(keyword)

  if (!normalizedKeyword) {
    return menus
  }

  return menus.reduce<MenuItem[]>((result, menu) => {
    if (menuMatchesKeyword(menu, normalizedKeyword)) {
      result.push(menu)
      return result
    }

    const filteredChildren = filterMenuTree(menu.children || [], normalizedKeyword)

    if (filteredChildren.length) {
      result.push({
        ...menu,
        children: filteredChildren
      })
    }

    return result
  }, [])
}

const testMenuList = computed(() => filterMenuTree(menuStore.menuListDataTest, testSearchMenuName.value))

const proMenuList = computed(() => filterMenuTree(menuStore.menuListPro, proSearchMenuName.value))

/**
 * 选择菜单
 * @param value 选中的数据
 * @param key
 */
const selectRow = (value: MenuItem[], key: 'selectedMenu' | 'selectedMenuTest') => {
  menuStore[key] = JSON.parse(JSON.stringify(value))
}

/**
 * 更新页面配置
 */
const beforeUpDatePageConfig = async () => {
  dictCodeStore.dictCodesUpdatable = []
  transferMenuGlobalStore.loading = true
  await pageConfigStore.getPageConfigByMenu(menuStore.selectedMenu, { pageConfig: true })

  console.group('开始新增页面配置============>')
  const allRequestsForUpdatingThePageConfig = pageConfigStore.addedPageConfigs.map(async (item: PageConfig) => {
    return await pageConfigStore.startUpdatePageConfig(item)
  })
  await Promise.allSettled([...allRequestsForUpdatingThePageConfig])
  console.groupEnd()

  console.group('开始更新页面配置详情============>')
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
  menuStore.syncMenuEnvironment(env)
}
</script>

<template>
  <div class="menu-content" v-loading="transferMenuGlobalStore.loading">
    <div class="left-content">
      <div class="search-box">
        <el-input
          v-model="testSearchMenuName"
          class="input-box"
          type="text"
          placeholder="请输入菜单名称或编码"
        />
      </div>
      <div class="table-headers">
        <el-button type="primary" @click="beforeUpDateMenuToTest('test')">同步正式菜单</el-button>
      </div>

      <el-table
        :data="testMenuList"
        :tree-props="{ checkStrictly: false }"
        row-key="id"
        :default-expand-all="Boolean(testSearchMenuName)"
        :empty-text="testSearchMenuName ? '暂无匹配菜单' : '暂无数据'"
        @selection-change="(value: MenuItem[]) => selectRow(value, 'selectedMenuTest')"
      >
        <el-table-column type="selection" width="55" :reserve-selection="true" />
        <el-table-column prop="comment" label="菜单名称" />
        <el-table-column prop="code" label="菜单编码" />
        <el-table-column prop="tstatus" label="启禁用">
          <template #default="scope">
            {{ scope.row.tstatus === 1 ? "启用" : "禁用" }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="right-content">
      <div class="search-box">
        <el-input
          v-model="proSearchMenuName"
          class="input-box"
          type="text"
          placeholder="请输入菜单名称或编码"
        />
      </div>
      <div class="table-headers">
        <el-button type="primary" @click="dataViewStore.beforeUpDateDataViewByMenu()">同步数据视图</el-button>
        <el-button type="primary" @click="beforeUpDatePageConfig()">同步页面配置</el-button>
        <el-button type="primary" @click="dictCodeStore.beforeUpdateDictCodes('update')">同步数据字典</el-button>
        <el-button type="primary" @click="pageButtonStore.beforeUpDatePageButton('update')">同步按钮</el-button>
        <el-button type="primary" @click="beforeUpDateMenuToTest('prod')">同步测试菜单</el-button>
      </div>

      <el-table
        :data="proMenuList"
        :tree-props="{ checkStrictly: false }"
        row-key="id"
        :default-expand-all="Boolean(proSearchMenuName)"
        :empty-text="proSearchMenuName ? '暂无匹配菜单' : '暂无数据'"
        @selection-change="(value: MenuItem[]) => selectRow(value, 'selectedMenu')"
      >
        <el-table-column type="selection" width="55" :reserve-selection="true" />
        <el-table-column prop="comment" label="菜单名称" />
        <el-table-column prop="code" label="菜单编码" />
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

  .table-headers {
    display: flex;
    align-items: center;
    margin: 20rpx 0 10px;

    .el-button {
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
