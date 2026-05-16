const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const { generateSrt } = require('../scripts/generate-subs.cjs')

describe('generate-subs.js — SRT subtitle generation', () => {
  const outDir = '/tmp/demo-test-subs'

  beforeEach(() => {
    fs.mkdirSync(outDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  const scenes = [
    { id: 1, duration: 5, narration: { en: 'Hello', zh: '你好' } },
    { id: 2, duration: 3, narration: { en: 'World', zh: '世界' } },
  ]

  test('GS01: generates English SRT with correct timing', () => {
    const srt = generateSrt(scenes, 'en')
    expect(srt).toContain('Hello')
    expect(srt).toContain('World')
    expect(srt).toContain('00:00:05.00 --> 00:00:08.00')
  })

  test('GS02: Chinese SRT uses Chinese narration text', () => {
    const srt = generateSrt(scenes, 'zh')
    expect(srt).toContain('你好')
    expect(srt).toContain('世界')
    expect(srt).not.toContain('Hello')
  })

  test('GS03: missing narration lang falls back to English', () => {
    const mixedScenes = [
      { id: 1, duration: 3, narration: { en: 'Fallback text' } },
    ]
    const srt = generateSrt(mixedScenes, 'fr')
    expect(srt).toContain('Fallback text')
  })

  test('GS04: empty scenes list produces empty SRT', () => {
    const srt = generateSrt([], 'en')
    expect(srt).toBe('')
  })

  test('GS05: correct cue numbering', () => {
    const srt = generateSrt(scenes, 'en')
    const lines = srt.split('\n')
    expect(lines[0]).toBe('1')
    expect(lines[4]).toBe('2')
  })

  test('GS06: CLI invocation writes SRT files', () => {
    const scenesJson = path.join(outDir, 'scenes.json')
    const data = { scenes }
    fs.writeFileSync(scenesJson, JSON.stringify(data))

    const scriptPath = path.join(__dirname, '..', 'scripts', 'generate-subs.cjs')
    const cmd = `node '${scriptPath}' --scenes '${scenesJson}' --languages '["en","zh"]' --output-dir '${outDir}'`
    execSync(cmd, { encoding: 'utf-8', timeout: 10000 })
    expect(fs.existsSync(path.join(outDir, 'demo.en.srt'))).toBe(true)
    expect(fs.existsSync(path.join(outDir, 'demo.zh.srt'))).toBe(true)
  })
})
