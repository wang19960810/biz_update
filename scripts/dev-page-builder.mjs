import { spawn } from 'node:child_process'

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const children = [
  spawn(npmCmd, ['run', 'page-builder:server'], { stdio: 'inherit' }),
  spawn(npmCmd, ['run', 'dev'], { stdio: 'inherit' })
]

// 同时停止 Vite 和 PageBuilder Node 服务。
const stop = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGINT')
    }
  }

  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
