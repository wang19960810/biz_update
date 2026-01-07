import CryptoJS from "crypto-js";

/**
 * await 错误捕获提示
 * @param promise 请求接口
 * @param errMessage 错误提示
 */
export const safeAwait = async (promise: any, errMessage?: string): Promise<any> => {
    try {
        const res = await promise
        if (res.data.success) {
            return res;
        }
        console.error(errMessage, res.data.errorMsg || res.data.message)
    } catch (error) {
        console.error(errMessage, error)
    }
}

/**
 * 父子节点排序
 * @param nodes
 */
export const parentFirstSort = (nodes: Array<any>) => {
    // 1. 收集所有节点ID
    const idSet = new Set(nodes.map(node => node.code));

    // 2. 构建数据结构
    const childrenMap = new Map(); // 父节点ID -> 子节点列表
    const roots = [];             // 根节点列表

    // 遍历所有节点，填充 childrenMap 和 roots
    for (const node of nodes) {
        const parentCode = node.parentCode;

        // 处理根节点
        if (parentCode === null || !idSet.has(parentCode)) {
            roots.push(node);
            continue;
        }

        // 处理子节点
        if (!childrenMap.has(parentCode)) {
            childrenMap.set(parentCode, []);
        }
        childrenMap.get(parentCode).push(node); // 保持原始添加顺序
    }

    // 3. 使用栈进行DFS遍历
    const result = [];
    const stack = [];

    // 根节点逆序入栈（确保原始顺序）
    for (let i = roots.length - 1; i >= 0; i--) {
        stack.push(roots[i]);
    }

    while (stack.length > 0) {
        const node = stack.pop();
        result.push(node);

        // 处理当前节点的子节点
        if (childrenMap.has(node.code)) {
            const children = childrenMap.get(node.code);
            // 子节点逆序入栈（确保弹出时保持原始顺序）
            for (let i = children.length - 1; i >= 0; i--) {
                stack.push(children[i]);
            }
        }
    }

    return result;
}

/**
 * 通过时间降序
 * @param data
 * @param timeName
 */
export const timeSort = (data: any[], timeName: string) => {
    return [...data].sort((a: any, b: any) => {
        const timeA = new Date(a[timeName] as string).getTime();
        const timeB = new Date(b[timeName] as string).getTime();

        // 处理无效日期
        if (isNaN(timeA)) return 1;   // a无效时排到后面
        if (isNaN(timeB)) return -1; // b无效时排到后面

        return timeB - timeA
    });
}

/** 加密方法*/
export const encrypt = (word: string) => {
    const iv = "1234123412ABCDEF";
    const key = "1234123412ABCDEF";
// const key = CryptoJS.enc.Utf8.parse("1234123412ABCDEF"); //十六位十六进制数作为密钥
// const iv = CryptoJS.enc.Utf8.parse("1234123412ABCDEF"); //十六位十六进制数作为密钥偏移量
    const fkey = CryptoJS.enc.Utf8.parse(key); // 密钥
    const fiv = CryptoJS.enc.Utf8.parse(iv); // 偏移量
    let srcs = CryptoJS.enc.Utf8.parse(word);
    let encrypted = CryptoJS.AES.encrypt(srcs, fkey, {
        iv: fiv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
}