const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const { runScript } = require('./helpers/run-script')

const CAPTURE_SCRIPT = 'scripts/capture-html.sh'

function havePlaywright() {
  try {
    execSync('npx playwright --version', { stdio: 'ignore', timeout: 5000 })
    return true
  } catch { return false }
}

describe('capture-html.sh — Playwright HTML capture', () => {
  const outDir = '/tmp/demo-test-capture-html'
  const testHtml = path.join(outDir, 'test.html')

  beforeAll(() => {
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(testHtml, '<!DOCTYPE html><html><body><h1>Test</h1></body></html>')
  })

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  test('CH01: valid HTML produces MP4', () => {
    const outFile = path.join(outDir, 'clip.mp4')

    if (!havePlaywright()) {
      // Playwright not available — verify error handling
      const result = runScript(CAPTURE_SCRIPT, [
        '--html', testHtml,
        '--duration', '1',
        '--output', outFile,
      ])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toMatch(/FAILED|Error|not found/i)
      return
    }

    const result = runScript(CAPTURE_SCRIPT, [
      '--html', testHtml,
      '--duration', '1',
      '--output', outFile,
    ])
    expect(result.exitCode).toBe(0)
    expect(fs.existsSync(outFile)).toBe(true)
    const stat = fs.statSync(outFile)
    expect(stat.size).toBeGreaterThan(1000)
  })

  test('CH02: missing HTML file exits with error', () => {
    const outFile = path.join(outDir, 'clip.mp4')
    const result = runScript(CAPTURE_SCRIPT, [
      '--html', '/nonexistent.html',
      '--duration', '1',
      '--output', outFile,
    ])
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('not found')
  })

  test('CH03: missing --output exits with usage', () => {
    const result = runScript(CAPTURE_SCRIPT, [
      '--html', testHtml,
      '--duration', '1',
    ])
    expect(result.exitCode).toBe(1)
  })
})
