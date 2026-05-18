import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"

type RouterModule = {
  routes?: RouteRecordRaw[]
  default?: RouteRecordRaw[]
}

const routerModules = import.meta.glob("../pages/**/router/index.ts", {
  eager: true
}) as Record<string, RouterModule>

const moduleRoutes = Object.values(routerModules).flatMap((module) => {
  return module.routes ?? module.default ?? []
})

const routes: Readonly<RouteRecordRaw[]> = [
  {
    path: "/",
    redirect: "/biz-tools/login"
  },
  ...moduleRoutes
]

const router = createRouter({
    history: createWebHistory(),
    scrollBehavior:(_to, _from, savedPosition) => {
        if(savedPosition) {
            return savedPosition
        } else {
            return {top: 0}
        }
    },
    routes
})


export default router
