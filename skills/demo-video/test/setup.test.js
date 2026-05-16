const path = require('path')
const { execSync } = require('child_process')
const { runScript } = require('./helpers/run-script')

const SETUP_SCRIPT = 'scripts/setup.sh'

function haveTool(name) {
  try {
    execSync(`command -v ${name}`, { stdio: 'ignore' })
    return true
  } catch { return false }
}

function allDepsPresent() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore', timeout: 3000 })
    execSync('npx playwright --version', { stdio: 'ignore', timeout: 5000 })
    execSync('python3 -m edge_tts --version', { stdio: 'ignore', timeout: 5000 })
    return true
  } catch { return false }
}

describe('setup.sh — dependency check', () => {
  test('SD01: runs and checks ffmpeg', () => {
    const result = runScript(SETUP_SCRIPT)
    if (allDepsPresent()) {
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('[OK]')
      expect(result.stdout).toContain('ffmpeg')
    } else {
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('[MISSING]')
      expect(result.stdout).toContain('ffmpeg')
    }
  })

  test('SD02: output format includes OK or MISSING per tool', () => {
    const result = runScript(SETUP_SCRIPT)
    expect(result.stdout).toMatch(/\[OK\]|\[MISSING\]/)
    expect(result.stdout).toContain('ffmpeg')
  })

  test('SD03: status line at end of output', () => {
    const result = runScript(SETUP_SCRIPT)
    const lines = result.stdout.trim().split('\n')
    const lastLine = lines[lines.length - 1]
    expect(lastLine).toMatch(/ready|missing|install|satisfied|dependencies/)
  })

  test('SD04: prints at least one tool line', () => {
    const result = runScript(SETUP_SCRIPT)
    const toolLines = result.stdout.split('\n').filter(l => l.startsWith('[OK]') || l.startsWith('[MISSING]'))
    expect(toolLines.length).toBeGreaterThanOrEqual(1)
  })
})
