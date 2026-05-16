#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function parseArgs() {
  const args = {}
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace(/^--/, '')
    args[key] = process.argv[i + 1]
  }
  if (!args.scenes || !args.languages || !args['output-dir']) {
    console.error('Usage: generate-subs.js --scenes <json> --languages <json> --output-dir <dir>')
    process.exit(1)
  }
  return args
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const cs = Math.floor((s % 1) * 100)
  const si = Math.floor(s)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(si).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

function generateSrt(scenes, lang) {
  const lines = []
  let cueIdx = 1
  let currentTime = 0

  for (const scene of scenes) {
    const text = (scene.narration && scene.narration[lang]) || (scene.narration && scene.narration.en) || ''
    const duration = scene.duration || 5
    if (!text) {
      currentTime += duration
      continue
    }
    const start = currentTime
    currentTime += duration
    lines.push(String(cueIdx))
    lines.push(`${formatTime(start)} --> ${formatTime(currentTime)}`)
    lines.push(text)
    lines.push('')
    cueIdx++
  }

  return lines.join('\n')
}

function main() {
  const args = parseArgs()
  const scenesPath = path.resolve(args.scenes)
  const languages = JSON.parse(args.languages)
  const outputDir = path.resolve(args['output-dir'])

  if (!fs.existsSync(scenesPath)) {
    console.error(`Scenes file not found: ${scenesPath}`)
    process.exit(1)
  }

  const scenesData = JSON.parse(fs.readFileSync(scenesPath, 'utf-8'))
  const scenes = scenesData.scenes || []
  fs.mkdirSync(outputDir, { recursive: true })

  for (const lang of languages) {
    const srt = generateSrt(scenes, lang)
    const outPath = path.join(outputDir, `demo.${lang}.srt`)
    fs.writeFileSync(outPath, srt, 'utf-8')
    console.log(`Wrote: ${outPath}`)
  }
}

if (require.main === module) main()
module.exports = { generateSrt }
