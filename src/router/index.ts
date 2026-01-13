import {createRouter, createWebHistory, type RouteRecordRaw} from "vue-router"

const routes: Readonly<RouteRecordRaw[]>= [
    {
        path: "/",
        component:() => import("../pages/transfer-menu/index.vue"),
        redirect: '/transform/login',
        children: []
    },{
        path: "/transform/login",
        component:() => import("../pages/transfer-menu/login/index.vue"),
        meta: {
            title: "登录",
            transition: "animate_fadeIn"
        },
    },{
        path: "/transform/home",
        component:() => import("../pages/transfer-menu/home/index.vue"),
        meta: {
            title: "首页",
            transition: "animate_fadeIn"
        },
    }, {
        path: "/report",
        component:() => import("../pages/report/main.vue"),
        meta: {
            title: "报工",
            transition: "animate_fadeIn"
        }
    },
]

const router = createRouter({
    history: createWebHistory(),
    scrollBehavior:(to, form, savedPosition) => {
        if(savedPosition) {
            return savedPosition
        } else {
            return {top: 0}
        }
    },
    routes
})


export default router