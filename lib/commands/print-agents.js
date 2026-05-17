import { readFileSync } from 'node:fs'
import { resolveAgents } from '../util/paths.js'

export async function printAgents() {
  return readFileSync(resolveAgents(), 'utf-8')
}