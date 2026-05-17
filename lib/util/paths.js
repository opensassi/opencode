import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const PKG_ROOT = resolve(__dirname, '../..')

export function resolveScript(path) {
  const base = resolve(PKG_ROOT, 'scripts', path)
  if (existsSync(base)) return base
  if (existsSync(base + '.js')) return base + '.js'
  if (existsSync(base + '.mjs')) return base + '.mjs'
  if (existsSync(base + '.sh')) return base + '.sh'
  const asDir = resolve(base, 'index.js')
  if (existsSync(asDir)) return asDir
  return base
}

export function resolveSkillScript(skillName, path) {
  return resolve(PKG_ROOT, 'skills', skillName, 'scripts', path)
}

export function resolveSkill(skillName) {
  return resolve(PKG_ROOT, 'skills', skillName, 'SKILL.md')
}

export function resolveAgents() {
  return resolve(PKG_ROOT, 'AGENTS.md')
}

export function resolveInitAgents() {
  return resolve(PKG_ROOT, 'AGENTS.init.md')
}