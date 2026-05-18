import type { RouteRecordRaw } from "vue-router"

export const routes: RouteRecordRaw[] = [
  {
    path: "/biz-tools",
    component: () => import("@pages/biz-tools/index.vue"),
    redirect: { name: "biz-tools-login" },
    children: [
      {
        path: "login",
        name: "biz-tools-login",
        component: () => import("@pages/biz-tools/login/index.vue"),
        meta: {
          title: "Login",
          transition: "route-fade"
        }
      },
      {
        path: "home",
        name: "biz-tools-home",
        component: () => import("@pages/biz-tools/home/index.vue"),
        meta: {
          title: "Home",
          transition: "route-fade"
        }
      },
      {
        // 系统配置单页面入口，所有菜单都统一收口到这个页面。
        path: "system-config",
        name: "biz-tools-system-config",
        component: () => import("@pages/biz-tools/system-config/index.vue"),
        meta: {
          title: "System Config",
          transition: "route-fade"
        }
      },
      {
        // 兼容旧的“新增菜单”地址，自动跳到单页面入口并切换到同步菜单视图。
        path: "menu/add",
        redirect: () => ({
          name: "biz-tools-system-config",
          query: {
            view: "menu-sync",
            tab: "add-menu"
          }
        })
      },
      {
        // 兼容旧的“同步配置”地址，自动跳到菜单关联同步模块的“更新页面数据”子视图。
        path: "page-config/update",
        redirect: () => ({
          name: "biz-tools-system-config",
          query: {
            view: "menu-sync",
            tab: "page-data"
          }
        })
      },
      {
        path: "system-config/menu/add",
        name: "biz-tools-menu-add",
        component: () => import("@pages/biz-tools/system-config/add-menu/index.vue"),
        meta: {
          title: "Menu Add",
          transition: "route-fade"
        }
      },
      {
        path: "system-config/page-config/update",
        name: "biz-tools-page-config-update",
        component: () => import("@pages/biz-tools/system-config/page-config-update/index.vue"),
        meta: {
          title: "Page Config Update",
          transition: "route-fade"
        }
      }
    ]
  }
]
