import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolveSkillScript, resolveScript, PKG_ROOT } from '../util/paths.js'

export async function runCommand(args) {
  const skillIdx = args.indexOf('--skill')
  let resolvedPath
  let restArgs

  if (skillIdx !== -1) {
    const skillName = args[skillIdx + 1]
    if (!skillName) {
      console.error('--skill requires a name argument')
      return 1
    }
    const scriptPath = args[skillIdx + 2]
    if (!scriptPath) {
      console.error('--skill requires a script path after the skill name')
      return 1
    }
    resolvedPath = resolveSkillScript(skillName, scriptPath)
    restArgs = args.slice(skillIdx + 3)
  } else {
    const scriptPath = args[0]
    if (!scriptPath) {
      console.error('Usage: opencode run <script> [args...]')
      return 1
    }
    resolvedPath = resolveScript(scriptPath)
    restArgs = args.slice(1)
  }

  if (!existsSync(resolvedPath)) {
    console.error(`Script not found: ${resolvedPath}`)
    return 1
  }

  const ext = resolvedPath.split('.').pop()

  return new Promise((resolve) => {
    let proc
    if (ext === 'sh' || ext === 'bash') {
      proc = spawn('bash', [resolvedPath, ...restArgs], { stdio: 'inherit' })
    } else if (ext === 'ps1') {
      proc = spawn('powershell', ['-File', resolvedPath, ...restArgs], { stdio: 'inherit' })
    } else if (ext === 'js' || ext === 'mjs') {
      proc = spawn(process.execPath, [resolvedPath, ...restArgs], { stdio: 'inherit' })
    } else {
      proc = spawn(resolvedPath, restArgs, { stdio: 'inherit' })
    }
    proc.on('exit', (code) => resolve(code ?? 1))
    proc.on('error', (err) => {
      console.error(`Failed to run script: ${err.message}`)
      resolve(1)
    })
  })
}