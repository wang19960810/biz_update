import axios from "axios";


const instance = axios.create({
    withCredentials: true,
    timeout: import.meta.env.VITE_APP_REQUEST_TIMEOUT || 60000,
    baseURL: import.meta.env.VITE_APP_BASE_URL_API || "/",
});


instance.interceptors.request.use(
    (config) => {
        sessionStorage.getItem("")
        const Jwt = sessionStorage.getItem("jwt") || '';
        if(Jwt) {
            config.headers["jwt"] = Jwt
        }
        console.log(config);
        return config
    },
    () => {}
)


instance.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        console.log(error);
        return Promise.reject(error)
    }
)

export { instance }
export default instance
