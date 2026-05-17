import { existsSync, readFileSync } from 'node:fs'
import { resolveSkill } from '../util/paths.js'

export async function printSkill(name) {
  const path = resolveSkill(name)
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf-8')
}