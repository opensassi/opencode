import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = resolve(fileURLToPath(import.meta.url), '..')

function run(script, args) {
  const result = spawnSync(process.execPath, [resolve(dir, script), ...args], {
    stdio: 'inherit'
  })
  return result.status ?? 1
}

const extractOk = run('extract-artifacts.js', ['--all'])
if (extractOk !== 0) process.exit(extractOk)

const testOk = run('test-artifacts.js', [])
process.exit(testOk ?? 0)
