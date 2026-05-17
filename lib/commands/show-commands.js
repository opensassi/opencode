import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '../..')

export async function showCommandsCommand() {
  const indexPath = resolve(PKG_ROOT, 'skills-index.json')
  const index = JSON.parse(readFileSync(indexPath, 'utf-8'))

  for (const skill of index.skills) {
    console.log(`\n## ${skill.name}`)
    console.log(skill.description)
    console.log()
    if (skill.commands.length === 0) {
      console.log('*(no commands defined)*')
      continue
    }
    console.log('| Command | Description |')
    console.log('|---------|-------------|')
    for (const cmd of skill.commands) {
      const name = typeof cmd === 'string' ? cmd : cmd.name
      const desc = typeof cmd === 'string' ? '' : (cmd.description || '')
      console.log(`| \`${name}\` | ${desc} |`)
    }
  }
}
