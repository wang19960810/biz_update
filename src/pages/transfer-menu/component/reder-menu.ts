import type {MenuItem} from "../types"

/**
 * 筛选出 新增的数据
 * @param data1
 * @param data2
 */
export const filterNewlyAddedData = (data1: MenuItem[], data2: MenuItem[]) => {

    const nodeMap = new Map()
    const codesPro = flattenTreeFlatMapProCodes(data2) // 正式环境所有的菜单的编码
    const testMenuListFlat = flattenTreeFlatMapTestMenu(data1) // 扁平化测试环境菜单
    const proMenuListFlat = flattenTreeFlatMapTestMenu(data2) // 扁平化正式环境菜单

    // 过滤出新增的菜单
    const addedData = testMenuListFlat.filter(i => {
        if (!codesPro.includes(i.code)) {
            i.children = []
            nodeMap.set(i.code, {...i})
            return i
        }
    })

    return {
        addedDataMenuList: treeRenderData(addedData, nodeMap),
        testMenuListFlat,
        proMenuListFlat
    }
}

/**
 * 构建树
 * @param data
 * @param nodeMap
 */
const treeRenderData = (data: MenuItem[], nodeMap: any) => {
    const tree: MenuItem[] = []
    if (!nodeMap) {
        nodeMap = new Map()
        data.forEach((item) => {
            nodeMap.set(item.code, {...item})
        })
    }
    data.map(i => {
        const currentNode = nodeMap.get(i.code);
        if (i.parentCode) {
            const parentNode = nodeMap.get(i.parentCode)
            if (!parentNode) {
                tree.push(currentNode)
            } else {
                parentNode.children.push(currentNode)
            }
        } else {
            tree.push(i)
        }
    })
    return tree
}

/**
 * 获取 正式环境 所有的菜单编码集合
 * @param tree
 */
export const flattenTreeFlatMapProCodes = (tree: MenuItem[]): string[] => {
    return tree.flatMap(node => [node.code, ...flattenTreeFlatMapProCodes(node.children || [])]);
}

/**
 * 扁平化 测试环境 菜单
 * @param tree
 */
export const flattenTreeFlatMapTestMenu = (tree: MenuItem[]): MenuItem[] => {
    return tree.flatMap(node => [node, ...flattenTreeFlatMapTestMenu(node.children || [])])
}