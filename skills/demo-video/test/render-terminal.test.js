const path = require('path')
const fs = require('fs')
const { runScript } = require('./helpers/run-script')

const RENDER_SCRIPT = 'scripts/render-terminal.cjs'
const FIXTURES = path.resolve(__dirname, 'fixtures')

describe('render-terminal.cjs — script timing → HTML terminal', () => {
  const outDir = '/tmp/demo-test-render-terminal'

  beforeEach(() => {
    fs.mkdirSync(outDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  test('RT01: valid timing and output files produce valid HTML', () => {
    const outFile = path.join(outDir, 'out.html')
    const result = runScript(RENDER_SCRIPT, [
      '--timing', path.join(FIXTURES, 'hello.timing'),
      '--output', path.join(FIXTURES, 'hello.output'),
      '--command', 'echo hi',
      '--speed', '3',
      '--html', outFile,
    ])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Wrote')
    expect(fs.existsSync(outFile)).toBe(true)
    const html = fs.readFileSync(outFile, 'utf-8')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('class="terminal"')
    expect(html).toContain('echo hi')
  })

  test('RT02: missing timing file exits with error', () => {
    const outFile = path.join(outDir, 'out.html')
    const result = runScript(RENDER_SCRIPT, [
      '--timing', '/nonexistent.timing',
      '--output', path.join(FIXTURES, 'hello.output'),
      '--html', outFile,
    ])
    expect(result.exitCode).toBe(1)
    expect(result.stdout + result.stderr).toMatch(/not found|Error|ENOENT/)
  })

  test('RT03: missing output file exits with error', () => {
    const outFile = path.join(outDir, 'out.html')
    const result = runScript(RENDER_SCRIPT, [
      '--timing', path.join(FIXTURES, 'hello.timing'),
      '--output', '/nonexistent.output',
      '--html', outFile,
    ])
    expect(result.exitCode).toBe(1)
    expect(result.stdout + result.stderr).toMatch(/not found|Error|ENOENT/)
  })

  test('RT04: HTML renders without errors', () => {
    const outFile = path.join(outDir, 'out.html')
    const result = runScript(RENDER_SCRIPT, [
      '--timing', path.join(FIXTURES, 'hello.timing'),
      '--output', path.join(FIXTURES, 'hello.output'),
      '--command', 'echo hi',
      '--speed', '3',
      '--html', outFile,
    ])
    expect(result.exitCode).toBe(0)
    const html = fs.readFileSync(outFile, 'utf-8')
    expect(html).toContain('<script>')
  })

  test('RT05: HTML includes segments from output file content', () => {
    const outFile = path.join(outDir, 'out.html')
    runScript(RENDER_SCRIPT, [
      '--timing', path.join(FIXTURES, 'hello.timing'),
      '--output', path.join(FIXTURES, 'hello.output'),
      '--command', 'echo hi',
      '--speed', '3',
      '--html', outFile,
    ])
    const html = fs.readFileSync(outFile, 'utf-8')
    expect(html).toContain('segs')
    expect(html).toContain('function next()')
    expect(html).not.toMatch(/fromCharCode/)
  })
})
