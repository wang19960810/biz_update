import axios from "axios";
import { ElMessage } from "element-plus";
import type {AxiosResponse} from "axios";

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
        console.log(response, 'response');
        // 业务状态码 601：未登录/登录失效，跳转到登录页
        if (response.data && (response.data.code === 601 || response.data.responseCode === "601")) {
            ElMessage.error('登录已失效，请重新登录!')
            setTimeout(() => {
                window.location.href = "/biz-tools/login"
            }, 1000)
            return Promise.reject(new Error("登录已失效，请重新登录"))
        }
        return response
    },
    (error) => {
        console.log(error);
        if(error.status === 500) {
            ElMessage.error('登录已失效，请重新登录!')
            setTimeout(() => {
                // window.location.href = "/biz-tools/login"
            }, 2000)
            return Promise.reject(new Error("登录已失效，请重新登录"))
        }
        return Promise.reject(error)
    }
)


export { instance }
export default instance