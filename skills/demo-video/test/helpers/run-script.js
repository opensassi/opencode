const { execSync } = require('child_process')
const path = require('path')

const SKILL_DIR = path.resolve(__dirname, '../..')

function runScript(scriptRelative, args = [], opts = {}) {
  const scriptPath = path.resolve(SKILL_DIR, scriptRelative)
  const timeout = opts.timeout || 30000
  const env = opts.env || process.env

  const isJs = scriptPath.endsWith('.js') || scriptPath.endsWith('.cjs')
  const quoted = args.map(a => `'${String(a).replace(/'/g, "'\\''")}'`).join(' ')
  const cmd = isJs ? `node '${scriptPath}' ${quoted}` : `'${scriptPath}' ${quoted}`

  try {
    const stdout = execSync(cmd, {
      encoding: 'utf-8',
      timeout,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: '/bin/bash',
    })
    return { stdout: stdout.trim(), stderr: '', exitCode: 0 }
  } catch (err) {
    return {
      stdout: (err.stdout || '').toString().trim(),
      stderr: (err.stderr || '').toString().trim(),
      exitCode: err.status !== undefined ? err.status : 1,
    }
  }
}

module.exports = { runScript, SKILL_DIR }
