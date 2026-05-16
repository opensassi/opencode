#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function parseArgs() {
  const args = {}
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace(/^--/, '')
    args[key] = process.argv[i + 1]
  }
  if (!args.mode || !args.output) {
    console.error('Usage: assemble.cjs --mode <video-only|audio-only|final> --manifest <json> --output <file> [--keep-raw]')
    console.error('  --mode video-only  : concat scene clips, no audio')
    console.error('  --mode audio-only  : concat TTS audio files sequentially')
    console.error('  --mode final       : mix existing video_master + audio_master')
    process.exit(1)
  }
  return args
}

function getDuration(file) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`,
      { encoding: 'utf-8', timeout: 10000 }
    ).trim()
    return parseFloat(out) || 0
  } catch { return 0 }
}

function assembleVideo(manifest, outputPath, keepRaw) {
  const scenes = manifest.scenes || []
  const workdir = path.dirname(path.resolve(outputPath))

  // Pad/trim each clip to match target duration
  const clipInfo = []
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i]
    if (!s.clip) { clipInfo.push(null); continue }
    const clipDur = getDuration(s.clip)
    const targetDur = s.duration || clipDur
    const adjusted = path.join(workdir, `adjusted_${i}.mkv`)
    const pad = targetDur - clipDur
    if (pad > 0.1) {
      execSync(`ffmpeg -y -i "${s.clip}" -filter:v "tpad=stop_mode=clone:stop_duration=${pad}" -an "${adjusted}"`, { stdio: 'ignore', timeout: 60000 })
    } else if (pad < -0.1) {
      execSync(`ffmpeg -y -i "${s.clip}" -filter:v "setpts=${(targetDur / clipDur).toFixed(3)}*PTS" -an "${adjusted}"`, { stdio: 'ignore', timeout: 60000 })
    } else {
      fs.copyFileSync(s.clip, adjusted)
    }
    clipInfo.push({ clip: adjusted, duration: targetDur })
  }

  const valid = clipInfo.filter(c => c !== null)
  if (valid.length === 0) throw new Error('No valid clips')

  const raw = path.join(workdir, 'video_raw.mkv')
  const inputArgs = valid.map(c => `-i "${c.clip}"`).join(' ')
  const labels = valid.map((_, i) => `[${i}:v]`).join('')
  execSync(
    `ffmpeg -y ${inputArgs} -filter_complex "${labels}concat=n=${valid.length}:v=1:a=0[out]" -map "[out]" -c:v libx264 -preset veryfast -crf 28 "${raw}"`,
    { stdio: 'ignore', timeout: 120000 }
  )

  const outResolved = path.resolve(outputPath)
  execSync(`ffmpeg -y -i "${raw}" -c:v libx264 -preset medium -crf 18 "${outResolved}"`, { stdio: 'ignore', timeout: 120000 })
  console.log(`Video master: ${outResolved}`)

  if (!keepRaw) {
    for (const c of valid) { try { fs.unlinkSync(c.clip) } catch {} }
    try { fs.unlinkSync(raw) } catch {}
    try { fs.unlinkSync(concatList) } catch {}
  }
}

function assembleAudio(manifest, outputPath, keepRaw) {
  const scenes = manifest.scenes || []
  const workdir = path.dirname(path.resolve(outputPath))
  const audioFiles = scenes.map(s => s.audio).filter(Boolean)

  if (audioFiles.length === 0) throw new Error('No audio files in manifest')

  const concatList = path.join(workdir, 'audio_concat.txt')
  const lines = audioFiles.map(f => `file '${f}'`)
  fs.writeFileSync(concatList, lines.join('\n'), 'utf-8')

  const outResolved = path.resolve(outputPath)
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:a aac -b:a 128k "${outResolved}"`, { stdio: 'ignore', timeout: 120000 })
  console.log(`Audio master: ${outResolved}`)

  if (!keepRaw) {
    try { fs.unlinkSync(concatList) } catch {}
  }
}

function assembleFinal(args) {
  const videoPath = path.resolve(args.video)
  const audioPath = path.resolve(args.audio)
  const outputPath = path.resolve(args.output)
  const keepRaw = args['keep-raw'] === 'true'

  if (!fs.existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`)
  if (!fs.existsSync(audioPath)) throw new Error(`Audio not found: ${audioPath}`)

  const vDur = getDuration(videoPath)
  const aDur = getDuration(audioPath)
  const diff = Math.abs(vDur - aDur)

  if (diff > 0.5) {
    throw new Error(`Video (${vDur.toFixed(2)}s) and audio (${aDur.toFixed(2)}s) mismatch by ${diff.toFixed(2)}s`)
  }

  const workdir = path.dirname(outputPath)
  const mixed = path.join(workdir, 'mixed.mkv')
  execSync(
    `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 128k -shortest "${mixed}"`,
    { stdio: 'ignore', timeout: 120000 }
  )

  const outResolved = path.resolve(outputPath)
  execSync(
    `ffmpeg -y -i "${mixed}" -c copy -movflags +faststart "${outResolved}"`,
    { stdio: 'ignore', timeout: 60000 }
  )
  console.log(`Final: ${outResolved}`)

  if (!keepRaw) {
    try { fs.unlinkSync(mixed) } catch {}
  }
}

function main() {
  const args = parseArgs()
  const mode = args.mode

  if (mode === 'video-only') {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(args.manifest), 'utf-8'))
    assembleVideo(manifest, args.output, args['keep-raw'] === 'true')
  } else if (mode === 'audio-only') {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(args.manifest), 'utf-8'))
    assembleAudio(manifest, args.output, args['keep-raw'] === 'true')
  } else if (mode === 'final') {
    assembleFinal(args)
  } else {
    console.error(`Unknown mode: ${mode}`)
    process.exit(1)
  }
}

if (require.main === module) main()
module.exports = { assembleVideo, assembleAudio, assembleFinal, getDuration }
