import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolveSkill, resolveInitAgents, PKG_ROOT } from '../util/paths.js'

const _require = createRequire(import.meta.url)

function tryResolveLocalOpencode() {
  try {
    const pkgPath = _require.resolve('opencode-ai/package.json')
    const pkgDir = resolve(pkgPath, '..')
    const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const binEntry = pkgJson.bin
    if (!binEntry) return null
    const binName = typeof binEntry === 'string' ? binEntry : binEntry.opencode
    const binPath = resolve(pkgDir, binName)
    if (existsSync(binPath)) return binPath
  } catch {}
  return null
}

function readPackageAgents() {
  return readFileSync(resolveInitAgents(), 'utf-8')
}

function readPackageOpensassiSkill() {
  return readFileSync(resolveSkill('opensassi'), 'utf-8')
}

function defaultOpencodeJson() {
  return JSON.stringify({
    $schema: "https://opencode.ai/config.json",
    permission: {
      skill: "allow",
      read: "allow",
      edit: "allow",
      glob: "allow",
      grep: "allow",
      bash: "ask",
      task: "allow",
      webfetch: "allow"
    },
    agent: {
      plan: {
        permission: {
          edit: "deny",
          bash: {
            "npx @opensassi/opencode *": "allow"
          }
        }
      }
    },
    instructions: ["AGENTS.md"],
    mcp: {
      playwright: {
        type: "local",
        command: ["npx", "@playwright/mcp@latest", "--headless"],
        enabled: true
      },
      debugger: {
        type: "local",
        command: ["gdb-mcp-server"],
        enabled: true
      }
    }
  }, null, 2) + '\n'
}

export async function initCommand(args) {
  const cwd = process.cwd()
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')

  const hasAgents = existsSync(resolve(cwd, 'AGENTS.md'))
  const hasOpencodeDir = existsSync(resolve(cwd, '.opencode'))
  const hasOpencodeJson = existsSync(resolve(cwd, '.opencode/opencode.json'))
  const hasOpensassiSkill = existsSync(resolve(cwd, '.opencode/skills/opensassi/SKILL.md'))
  const hasGitignore = existsSync(resolve(cwd, '.gitignore'))

  if (hasOpensassiSkill && !force) {
    console.log('Already initialized. Use --force to refresh.')
    return
  }

  const pkgAgents = readPackageAgents()
  const pkgSkill = readPackageOpensassiSkill()

  if (dryRun) {
    console.log('Dry-run: would write the following files')
    if (!hasAgents) console.log('  CREATE AGENTS.md  (from package)')
    else console.log('  APPEND AGENTS.md  (append opensassi instructions)')
    console.log('  WRITE .opencode/skills/opensassi/SKILL.md')
    console.log('  WRITE .opencode/opencode.json')
    if (!hasGitignore) console.log('  CREATE .gitignore')
    console.log('  APPEND .gitignore  (.opencode/skills/)')
    return
  }

  const separator = '\n---\n\n'
  const agentHeader = 'Instructions from: @opensassi/opencode\n\n'

  if (!hasAgents) {
    writeFileSync(resolve(cwd, 'AGENTS.md'), pkgAgents, 'utf-8')
    console.log('Created AGENTS.md')
  } else {
    const existing = readFileSync(resolve(cwd, 'AGENTS.md'), 'utf-8')
    if (!existing.includes('@opensassi/opencode')) {
      appendFileSync(resolve(cwd, 'AGENTS.md'), separator + agentHeader + pkgAgents, 'utf-8')
      console.log('Appended opensassi instructions to AGENTS.md')
    } else {
      console.log('AGENTS.md already includes opensassi instructions')
    }
  }

  {
    const skillDir = resolve(cwd, '.opencode/skills/opensassi')
    if (!existsSync(skillDir)) mkdirSync(skillDir, { recursive: true })
    writeFileSync(resolve(skillDir, 'SKILL.md'), pkgSkill, 'utf-8')
    console.log('Wrote .opencode/skills/opensassi/SKILL.md')
  }

  if (!hasOpencodeJson) {
    const opencodeDir = resolve(cwd, '.opencode')
    if (!existsSync(opencodeDir)) mkdirSync(opencodeDir, { recursive: true })
    writeFileSync(resolve(opencodeDir, 'opencode.json'), defaultOpencodeJson(), 'utf-8')
    console.log('Wrote .opencode/opencode.json')
  } else {
    console.log('.opencode/opencode.json already exists (skipped)')
  }

  const gitignorePath = resolve(cwd, '.gitignore')
  if (!hasGitignore) {
    writeFileSync(gitignorePath, '.opencode/skills/\n', 'utf-8')
    console.log('Created .gitignore with .opencode/skills/ rule')
  } else {
    const gitignore = readFileSync(gitignorePath, 'utf-8')
    if (!gitignore.includes('.opencode/skills/')) {
      appendFileSync(gitignorePath, '\n.opencode/skills/\n', 'utf-8')
      console.log('Added .opencode/skills/ to .gitignore')
    } else {
      console.log('.opencode/skills/ already in .gitignore')
    }
  }

  // === Post-write: handoff to opencode ===

  if (process.env.OPENCODE === '1') {
    console.log('\nFiles written. Use `skill opensassi` to continue within this session.')
    return
  }

  await spawnOpencode(cwd)
}

function tryResolveGlobalOpencode() {
  const { spawnSync } = _require('node:child_process')
  const platform = process.platform
  const whichCmd = platform === 'win32' ? 'where' : 'command'
  const whichArgs = platform === 'win32' ? ['opencode.cmd'] : ['-v', 'opencode']
  const result = spawnSync(whichCmd, whichArgs, { stdio: 'pipe', encoding: 'utf-8' })
  if (result.status !== 0) return null
  const binPath = result.stdout?.toString().trim().split('\n')[0]
  return binPath || null
}

async function spawnOpencode(cwd) {
  const opencodeBin = tryResolveLocalOpencode() ?? tryResolveGlobalOpencode()

  if (!opencodeBin) {
    console.log('\nopencode CLI not found.')
    console.log('Install it globally:  npm install -g opencode-ai@1.14.51')
    console.log('Or run init from within an opencode session (recommended):  skill opensassi')
    return
  }

  console.log('\nInitializing opensassi inside opencode...')
  const child = spawn(opencodeBin, ['run', '--print-logs', 'skill opensassi'], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env }
  })
  return new Promise((resolve) => {
    child.on('exit', (code) => {
      if (code !== 0) console.log(`\nopencode exited with code ${code}`)
      resolve()
    })
  })
}