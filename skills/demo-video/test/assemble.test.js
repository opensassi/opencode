const path = require('path')
const fs = require('fs')
const { assembleVideo, assembleAudio, assembleFinal, getDuration } = require('../scripts/assemble.cjs')

describe('assemble.cjs — ffmpeg assembly pipeline', () => {
  const outDir = '/tmp/demo-test-assemble'
  const clipDir = path.join(outDir, 'clips')

  function generateTestClip(file, duration, color = 'black') {
    const { execSync } = require('child_process')
    execSync(
      `ffmpeg -y -f lavfi -i "color=c=${color}:s=1920x1080:d=${duration}" -c:v libx264 -preset ultrafast -crf 28 "${file}"`,
      { stdio: 'ignore', timeout: 30000 }
    )
  }

  function generateTestAudio(file, duration) {
    const { execSync } = require('child_process')
    execSync(
      `ffmpeg -y -f lavfi -i "sine=frequency=440:duration=${duration}" -c:a mp3 -b:a 128k "${file}"`,
      { stdio: 'ignore', timeout: 15000 }
    )
  }

  beforeAll(() => {
    fs.mkdirSync(clipDir, { recursive: true })
  })

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  test('AS01: getDuration returns correct length', () => {
    const clip = path.join(clipDir, 'duration_test.mp4')
    generateTestClip(clip, 2)
    const dur = getDuration(clip)
    expect(dur).toBeGreaterThan(1.5)
    expect(dur).toBeLessThan(2.5)
  })

  test('AS02: assembleVideo two clips without audio', () => {
    const c1 = path.join(clipDir, 'vid_clip1.mp4')
    const c2 = path.join(clipDir, 'vid_clip2.mp4')
    generateTestClip(c1, 1)
    generateTestClip(c2, 1.5)

    const output = path.join(outDir, 'video_master.mp4')
    const manifest = {
      scenes: [
        { clip: c1, duration: 1 },
        { clip: c2, duration: 1.5 },
      ],
    }
    const manifestPath = path.join(outDir, 'manifest_video.json')
    fs.writeFileSync(manifestPath, JSON.stringify(manifest))

    assembleVideo(manifest, output, true)
    expect(fs.existsSync(output)).toBe(true)
    const finalDur = getDuration(output)
    expect(finalDur).toBeGreaterThan(2)
  })

  test('AS03: assembleAudio concatenates audio files', () => {
    const a1 = path.join(clipDir, 'audio_a.mp3')
    const a2 = path.join(clipDir, 'audio_b.mp3')
    generateTestAudio(a1, 1)
    generateTestAudio(a2, 1.5)

    const output = path.join(outDir, 'audio_master.m4a')
    const manifest = {
      scenes: [
        { audio: a1 },
        { audio: a2 },
      ],
    }
    const manifestPath = path.join(outDir, 'manifest_audio.json')
    fs.writeFileSync(manifestPath, JSON.stringify(manifest))

    assembleAudio(manifest, output, true)
    expect(fs.existsSync(output)).toBe(true)
    const dur = getDuration(output)
    expect(dur).toBeGreaterThan(2)
  })

  test('AS04: assembleFinal rejects mismatched lengths', () => {
    const shortVid = path.join(clipDir, 'short_vid.mp4')
    const longAud = path.join(clipDir, 'long_aud.mp3')
    generateTestClip(shortVid, 1)
    generateTestAudio(longAud, 5)

    expect(() => {
      assembleFinal({
        video: shortVid,
        audio: longAud,
        output: path.join(outDir, 'mismatch.mp4'),
        'keep-raw': 'true',
      })
    }).toThrow()
  })
})
