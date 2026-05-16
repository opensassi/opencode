const path = require('path')
const fs = require('fs')
const { runScript } = require('./helpers/run-script')

const SLIDE_SCRIPT = 'scripts/render-slide.cjs'

describe('render-slide.js — narration HTML slides', () => {
  const outDir = '/tmp/demo-test-render-slide'

  beforeEach(() => {
    fs.mkdirSync(outDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  test('RS01: basic bullets produce valid HTML', () => {
    const outFile = path.join(outDir, 'slide.html')
    const result = runScript(SLIDE_SCRIPT, [
      '--title', 'Demo',
      '--bullets', '["Point A","Point B"]',
      '--output', outFile,
    ])
    expect(result.exitCode).toBe(0)
    expect(fs.existsSync(outFile)).toBe(true)
    const html = fs.readFileSync(outFile, 'utf-8')
    expect(html).toContain('<h1>Demo</h1>')
    expect(html).toContain('Point A')
    expect(html).toContain('Point B')
  })

  test('RS02: empty bullets array', () => {
    const outFile = path.join(outDir, 'slide.html')
    const result = runScript(SLIDE_SCRIPT, [
      '--title', 'Empty',
      '--bullets', '[]',
      '--output', outFile,
    ])
    expect(result.exitCode).toBe(0)
    const html = fs.readFileSync(outFile, 'utf-8')
    expect(html).toContain('<ul></ul>')
  })

  test('RS03: custom colors appear in CSS', () => {
    const outFile = path.join(outDir, 'slide.html')
    runScript(SLIDE_SCRIPT, [
      '--title', 'Colors',
      '--bullets', '["A"]',
      '--background', '#000000',
      '--foreground', '#ffffff',
      '--output', outFile,
    ])
    const html = fs.readFileSync(outFile, 'utf-8')
    expect(html).toContain('background:#000000')
    expect(html).toContain('color:#ffffff')
  })

  test('RS04: missing title exits with usage', () => {
    const outFile = path.join(outDir, 'slide.html')
    const result = runScript(SLIDE_SCRIPT, [
      '--bullets', '["A"]',
      '--output', outFile,
    ])
    expect(result.exitCode).toBe(1)
  })

  test('RS05: special characters are HTML-escaped', () => {
    const outFile = path.join(outDir, 'slide.html')
    runScript(SLIDE_SCRIPT, [
      '--title', 'Test',
      '--bullets', '["A & B < C > D"]',
      '--output', outFile,
    ])
    const html = fs.readFileSync(outFile, 'utf-8')
    expect(html).toContain('&amp;')
    expect(html).not.toContain('< C >')
  })
})
