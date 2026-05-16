const path = require('path')
const fs = require('fs')
const { runScript } = require('./helpers/run-script')

const TTS_SCRIPT = 'scripts/generate-tts.sh'

describe('generate-tts.sh — edge-tts audio generation', () => {
  const outDir = '/tmp/demo-test-tts'

  beforeAll(() => {
    fs.mkdirSync(outDir, { recursive: true })
  })

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  test('GT01: generates MP3 from English text', () => {
    const outFile = path.join(outDir, 'test.mp3')

    if (!process.env.CI) {
      try {
        require('child_process').execSync('python3 -m edge_tts --version', { stdio: 'ignore' })
      } catch {
        // edge-tts not available — skip
        return
      }
    }

    const result = runScript(TTS_SCRIPT, [
      '--text', 'Hello world',
      '--voice', 'en-US-AriaNeural',
      '--output', outFile,
    ])
    expect(result.exitCode).toBe(0)
    expect(fs.existsSync(outFile)).toBe(true)
    expect(fs.statSync(outFile).size).toBeGreaterThan(500)
  })

  test('GT02: empty text still runs without crash', () => {
    const outFile = path.join(outDir, 'empty.mp3')
    const result = runScript(TTS_SCRIPT, [
      '--text', '',
      '--voice', 'en-US-AriaNeural',
      '--output', outFile,
    ])
    // edge-tts may produce a silent file or error — either is acceptable
    expect([0, 1]).toContain(result.exitCode)
  })

  test('GT03: missing --output exits with usage', () => {
    const result = runScript(TTS_SCRIPT, [
      '--text', 'Hello',
      '--voice', 'en-US-AriaNeural',
    ])
    expect(result.exitCode).toBe(1)
  })
})
