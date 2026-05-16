const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const { assembleVideo, assembleAudio, assembleFinal, getDuration } = require('../scripts/assemble.cjs')
const { runScript } = require('./helpers/run-script')

const SKILL_DIR = path.resolve(__dirname, '..')
const FIXTURES = path.resolve(__dirname, 'fixtures')

describe('integration — full pipeline', () => {
  const outDir = '/tmp/demo-test-integration'
  const clipDir = path.join(outDir, 'clips')
  const audioDir = path.join(outDir, 'audio')
  const subsDir = path.join(outDir, 'subs')
  const htmlDir = path.join(outDir, 'html')

  function haveFfmpeg() {
    try { execSync('ffmpeg -version', { stdio: 'ignore', timeout: 5000 }); return true }
    catch { return false }
  }

  function havePlaywright() {
    try { execSync('npx playwright --version', { stdio: 'ignore', timeout: 5000 }); return true }
    catch { return false }
  }

  beforeAll(() => {
    fs.mkdirSync(clipDir, { recursive: true })
    fs.mkdirSync(audioDir, { recursive: true })
    fs.mkdirSync(subsDir, { recursive: true })
    fs.mkdirSync(htmlDir, { recursive: true })
  })

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  test('IT01: render terminal scene + slide scene + subs', () => {
    // Step 1 — Render terminal HTML
    const termHtml = path.join(htmlDir, 'terminal.html')
    const termResult = runScript('scripts/render-terminal.cjs', [
      '--timing', path.join(FIXTURES, 'hello.timing'),
      '--output', path.join(FIXTURES, 'hello.output'),
      '--command', 'echo integration-test',
      '--speed', '3',
      '--html', termHtml,
    ])
    expect(termResult.exitCode).toBe(0)
    expect(fs.existsSync(termHtml)).toBe(true)

    // Step 2 — Render narration slide
    const slideHtml = path.join(htmlDir, 'slide.html')
    const slideResult = runScript('scripts/render-slide.cjs', [
      '--title', 'Integration Test',
      '--bullets', '["Passed","Verified"]',
      '--output', slideHtml,
    ])
    expect(slideResult.exitCode).toBe(0)
    expect(fs.existsSync(slideHtml)).toBe(true)

    // Step 3 — Generate subtitles
    const scenesFixture = path.join(FIXTURES, 'demo-scenes.json')
    const subsResult = runScript('scripts/generate-subs.cjs', [
      '--scenes', scenesFixture,
      '--languages', '["en","zh"]',
      '--output-dir', subsDir,
    ])
    expect(subsResult.exitCode).toBe(0)
    expect(fs.existsSync(path.join(subsDir, 'demo.en.srt'))).toBe(true)
    const enSrt = fs.readFileSync(path.join(subsDir, 'demo.en.srt'), 'utf-8')
    expect(enSrt).toContain('Running the first command.')
    expect(enSrt).toContain('Key features include.')
  })

  test('IT02: assembly with empty manifest throws error', () => {
    expect(() => {
      assembleVideo({ scenes: [] }, path.join(outDir, 'empty.mp4'), true)
    }).toThrow(/No valid clips/)
  })

  test('IT03: assemble video + audio + final with synthetic clips', () => {
    if (!haveFfmpeg()) return

    const clip = path.join(clipDir, 'test_clip.mp4')
    const audio = path.join(audioDir, 'test_audio.wav')

    execSync(`ffmpeg -y -f lavfi -i "color=c=blue:s=1920x1080:d=2" -c:v libx264 -preset ultrafast -crf 28 "${clip}"`, { stdio: 'ignore', timeout: 15000 })
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=440:duration=2" -c:a pcm_s16le "${audio}"`, { stdio: 'ignore', timeout: 15000 })

    const manifest = {
      scenes: [{ clip, duration: 2, audio }],
    }

    const videoMaster = path.join(outDir, 'it03_video.mp4')
    const audioMaster = path.join(outDir, 'it03_audio.m4a')
    const finalOut = path.join(outDir, 'it03_final.mp4')

    assembleVideo(manifest, videoMaster, true)
    expect(fs.existsSync(videoMaster)).toBe(true)
    expect(getDuration(videoMaster)).toBeGreaterThan(1)

    assembleAudio(manifest, audioMaster, true)
    expect(fs.existsSync(audioMaster)).toBe(true)
    expect(getDuration(audioMaster)).toBeGreaterThan(1)

    assembleFinal({ video: videoMaster, audio: audioMaster, output: finalOut, 'keep-raw': 'true' })
    expect(fs.existsSync(finalOut)).toBe(true)
    expect(getDuration(finalOut)).toBeGreaterThan(1)
  })
})
