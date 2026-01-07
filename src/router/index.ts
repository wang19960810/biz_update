import { createRouter, createWebHistory} from "vue-router"

const routes = [
    {
        path: "/",
        component:() => import("../pages/transfer-menu/index.vue"),
        meta: {
            title: "我是登录页",
            transition: "animate_fadeIn"
        },
    },{
        path: "/transform/home",
        component:() => import("../pages/transfer-menu/home/index.vue"),
        meta: {
            title: "我是登录页",
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