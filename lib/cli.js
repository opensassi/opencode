import { initCommand } from './commands/init.js'
import { printSkill } from './commands/print-skill.js'
import { runCommand } from './commands/run.js'

export async function cli(args) {
  if (args.length === 0 || args[0] === '--help' || args[0] === 'help') {
    console.log(`Usage: opencode <command> [options]

Commands:
  init                          Bootstrap this directory with opensassi skills
  run <path> [args...]          Run a script from the package scripts/ directory
  run --skill <name> <path>     Run a script from a skill's scripts/ directory
  <skill-name>                  Print a skill's SKILL.md content to stdout
  <skill-name> --command="..."  Execute a skill command
  help                          Show this help`)
    return 0
  }

  const cmd = args[0]

  if (cmd === 'init') {
    await initCommand(args.slice(1))
    return 0
  }

  if (cmd === 'run') {
    const code = await runCommand(args.slice(1))
    return code
  }

  const skillContent = await printSkill(cmd)
  if (skillContent === null) {
    console.error(`Unknown command or skill: ${cmd}`)
    return 1
  }
  console.log(skillContent)
  return 0
}