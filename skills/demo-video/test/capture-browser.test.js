const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const { runScript } = require('./helpers/run-script')

const CAPTURE_SCRIPT = 'scripts/capture-browser.sh'

function havePlaywright() {
  try {
    execSync('npx playwright --version', { stdio: 'ignore', timeout: 5000 })
    return true
  } catch { return false }
}

describe('capture-browser.sh — Playwright browser capture', () => {
  const outDir = '/tmp/demo-test-capture-browser'

  beforeAll(() => {
    fs.mkdirSync(outDir, { recursive: true })
  })

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  test('CB01: valid URL produces MP4 when playwright available', () => {
    const outFile = path.join(outDir, 'browser.mp4')

    if (!havePlaywright()) {
      const result = runScript(CAPTURE_SCRIPT, [
        '--url', 'https://example.com',
        '--duration', '1',
        '--output', outFile,
      ])
      expect(result.exitCode).toBeGreaterThanOrEqual(1)
      return
    }

    const result = runScript(CAPTURE_SCRIPT, [
      '--url', 'https://example.com',
      '--duration', '1',
      '--output', outFile,
    ])
    expect(result.exitCode).toBe(0)
    expect(fs.existsSync(outFile)).toBe(true)
  })

  test('CB02: with click action does not crash', () => {
    const outFile = path.join(outDir, 'browser-click.mp4')

    if (!havePlaywright()) {
      return
    }

    const result = runScript(CAPTURE_SCRIPT, [
      '--url', 'https://example.com',
      '--actions', '[{"type":"click","selector":"h1"}]',
      '--duration', '1',
      '--output', outFile,
    ])
    expect(result.exitCode).toBe(0)
  })

  test('CB03: missing --url exits with usage', () => {
    const result = runScript(CAPTURE_SCRIPT, [
      '--duration', '1',
      '--output', '/tmp/x.mp4',
    ])
    expect(result.exitCode).toBe(1)
  })
})
