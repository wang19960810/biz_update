import axios from "axios";
import { ElMessage } from "element-plus";
import type {AxiosResponse} from "axios";

const errorCodeMapText: Record<number, string> = {
    601: "登录已失效，请重新登录!"
}

const errorCodeMapFun= (code: number | string) =>  {
    const codeNum = Number(code);
    const handlers: Record<number, () => void> = {
        601: () => {
            ElMessage.error(errorCodeMapText[601])
            setTimeout(() => {
                window.location.href = "/biz-tools/login"
            }, 1000)
        }
    }
    if(handlers[codeNum]) {
        handlers[codeNum]()
    } else {
        ElMessage.error("请求失败,错误未定义！")
    }
}

const instance = axios.create({
    timeout: (import.meta.env as any).VITE_APP_REQUEST_TIMEOUT || 60000,
});

instance.interceptors.request.use(
    (config) => {
        const Jwt = sessionStorage.getItem("jwt") || '';
        if(Jwt) {
            config.headers["jwt"] = Jwt
        }
        // 将完整 URL 重写为 Vite 代理路径，解决 CORS 问题
        if (config.url?.startsWith('http://bz1.sxg2017.com:8200')) {
            config.url = config.url.replace('http://bz1.sxg2017.com:8200', '/api-test')
        }
        if (config.url?.startsWith('https://crm-prod.sxg2017.com:18088')) {
            config.url = config.url.replace('https://crm-prod.sxg2017.com:18088', '/api-prod')
        }
        return config
    },
    () => {}
)

instance.interceptors.response.use(
    (response: AxiosResponse) => {
        // 业务状态码 601：未登录/登录失效，跳转到登录页
        if (response.data && (response.data.code === 601 || response.data.responseCode === "601")) {
            errorCodeMapFun(601)
            return Promise.reject(new Error("登录已失效，请重新登录"))
        }
        return response
    },
    (error) => {
        console.log(error);
        if (error.status === 601) {
            errorCodeMapFun(error.status)
            return Promise.reject(new Error("登录已失效，请重新登录"))
        }
        ElMessage.error("请求失败！")
        return Promise.reject(error)
    }
)



export { instance }
export default instance