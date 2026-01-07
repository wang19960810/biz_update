/**
 * 接口请求基本参数
 */
export interface Serve {
    // 测试域名
    testUrl: string,
    // 测试Jwt
    testJwt: string,
    // 正式域名
    prodUrl: string,
    // 正式Jwt
    prodJwt: string,
}

export interface ServeOptions {
    // 请求间隔
    delay?: number
    // 重试次数
    maxRetries?: number
    // 重试延迟
    retryDelay?: number
}