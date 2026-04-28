import { spawn } from 'node:child_process'
import process from 'node:process'

const commands = [
  {
    name: 'api',
    command: 'node',
    args: ['server/index.js'],
    env: { PORT: process.env.API_PORT || '3001' },
  },
  {
    name: 'web',
    command: 'vite',
    args: ['--host', '127.0.0.1', '--strictPort'],
  },
]

const children = commands.map(({ name, command, args, env }) => {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    shell: true,
    stdio: 'pipe',
  })

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`)
  })

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${name}] ${data}`)
  })

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      process.exitCode = code
    }
  })

  return child
})

const stop = () => {
  for (const child of children) {
    child.kill('SIGTERM')
  }
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
