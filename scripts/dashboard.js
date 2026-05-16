#!/usr/bin/env node
import { startDashboard } from '../dashboard/dist/index.js'

const args = process.argv.slice(2)
const portIdx = args.indexOf('--port')
const hostIdx = args.indexOf('--host')
const sessionsIdx = args.indexOf('--sessions')
const repoIdx = args.indexOf('--repo')
const gitSinceIdx = args.indexOf('--git-since')

startDashboard({
  port: portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : undefined,
  host: hostIdx !== -1 ? args[hostIdx + 1] : undefined,
  sessionsDir: sessionsIdx !== -1 ? args[sessionsIdx + 1] : undefined,
  repoDir: repoIdx !== -1 ? args[repoIdx + 1] : undefined,
  gitSince: gitSinceIdx !== -1 ? args[gitSinceIdx + 1] : undefined,
})
