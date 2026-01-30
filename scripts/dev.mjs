import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const processes = [
  spawn(npmCmd, ['--prefix', path.join(rootDir, 'portal'), 'run', 'dev'], {
    stdio: 'inherit',
    cwd: rootDir
  }),
  spawn(npmCmd, ['--prefix', path.join(rootDir, 'doc'), 'run', 'dev'], {
    stdio: 'inherit',
    cwd: rootDir
  }),
  spawn(npmCmd, ['--prefix', path.join(rootDir, 'web'), 'run', 'dev'], {
    stdio: 'inherit',
    cwd: rootDir
  })
]

let shuttingDown = false
const shutdown = (signal = 'SIGINT') => {
  if (shuttingDown) return
  shuttingDown = true
  for (const proc of processes) {
    if (!proc.killed) {
      proc.kill(signal)
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

processes.forEach((proc) => {
  proc.on('exit', (code) => {
    if (!shuttingDown) {
      shutdown('SIGTERM')
    }
    if (typeof code === 'number') {
      process.exit(code)
    }
  })
})
