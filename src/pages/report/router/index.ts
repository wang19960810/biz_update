import type { RouteRecordRaw } from "vue-router"

export const routes: RouteRecordRaw[] = [
  {
    path: "/report/main",
    component: () => import("@pages/report/main.vue"),
  }
]
