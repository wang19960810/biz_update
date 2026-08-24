import http from 'node:http'

import { PORT } from './page-builder/constants.mjs'
import { sendJson } from './page-builder/file-utils.mjs'
import {
  handleDatabase,
  handleExport,
  handleLocalStatus,
  handlePageData,
  handlePageDataUpdate,
  handleSync
} from './page-builder/server-handlers.mjs'

// 创建 PageBuilder HTTP 服务并分发接口请求。
const server = http.createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 404, { code: 404, message: 'not found' })
    return
  }

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, { code: 0, message: 'ok' })
    return
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  try {
    if (request.method === 'GET' && url.pathname === '/page-builder/health') {
      sendJson(response, 200, { code: 0, message: 'ok', data: { port: PORT } })
      return
    }

    if (request.method === 'GET' && url.pathname === '/page-builder/database') {
      await handleDatabase(request, response)
      return
    }

    if (request.method === 'GET' && url.pathname.startsWith('/page-builder/page-data/')) {
      const pageId = decodeURIComponent(url.pathname.slice('/page-builder/page-data/'.length))
      await handlePageData(pageId, response)
      return
    }

    if (request.method === 'POST' && url.pathname.startsWith('/page-builder/page-data/')) {
      const pageId = decodeURIComponent(url.pathname.slice('/page-builder/page-data/'.length))
      await handlePageDataUpdate(pageId, request, response)
      return
    }

    if (request.method === 'POST' && url.pathname === '/page-builder/sync') {
      await handleSync(request, response)
      return
    }

    if (request.method === 'POST' && url.pathname === '/page-builder/local-status') {
      await handleLocalStatus(request, response)
      return
    }

    if (request.method === 'POST' && url.pathname === '/page-builder/export') {
      await handleExport(request, response)
      return
    }

    sendJson(response, 404, { code: 404, message: 'not found' })
  } catch (error) {
    sendJson(response, 500, {
      code: 500,
      message: error instanceof Error ? error.message : 'server error'
    })
  }
})

// 启动本地 PageBuilder 服务。
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[page-builder] server listening on http://127.0.0.1:${PORT}`)
})

// 关闭服务并退出当前进程。
const stop = () => {
  server.close(() => process.exit(0))
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
