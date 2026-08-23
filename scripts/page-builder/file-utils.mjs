import path from 'node:path'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'

import { DEFAULT_DATABASE } from './constants.mjs'

// 深拷贝简单 JSON 数据，避免修改默认数据库对象。
export const clone = value => JSON.parse(JSON.stringify(value))

// 确保目标目录存在。
export const ensureDir = async targetPath => {
  await mkdir(targetPath, { recursive: true })
}

// 递归删除目录或文件，目标不存在时不报错。
export const removeDir = async targetPath => {
  await rm(targetPath, { recursive: true, force: true })
}

// 将本地生成文件复制到业务代码目录。
export const copyGeneratedFile = async (sourceFile, targetFile) => {
  await ensureDir(path.dirname(targetFile))
  await copyFile(sourceFile, targetFile)
}

// 确保父目录存在后写入文本文件。
export const ensureFile = async (targetFile, content) => {
  await ensureDir(path.dirname(targetFile))
  await writeFile(targetFile, content, 'utf8')
}

// 读取 JSON 文件；文件不存在或内容损坏时返回空数据库。
export const readJsonFile = async filePath => {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return clone(DEFAULT_DATABASE)
  }
}

// 将对象格式化后写入 JSON 文件。
export const writeJsonFile = async (filePath, data) => {
  await ensureFile(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

// 读取 HTTP 请求体并解析为 JSON。
export const readBody = async request => {
  return await new Promise((resolve, reject) => {
    let raw = ''

    request.on('data', chunk => {
      raw += chunk
    })

    request.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })

    request.on('error', reject)
  })
}

// 使用统一响应头返回 JSON 数据。
export const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  })
  response.end(`${JSON.stringify(payload, null, 2)}\n`)
}
