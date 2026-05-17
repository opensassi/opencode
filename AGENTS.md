# opencode Agent Instructions — @opensassi/opencode

This project is the **@opensassi/opencode** package itself.

## Local Development Override

All skill files reference `npx @opensassi/opencode` as the published CLI command.
When developing locally in this repo, substitute `npm run opencode --` instead:

| Published CLI | Local equivalent |
|---------------|------------------|
| `npx @opensassi/opencode <skill-name>` | `npm run opencode -- <skill-name>` |
| `npx @opensassi/opencode run <path>` | `npm run opencode -- run <path>` |
| `npx @opensassi/opencode run --skill <name> <path>` | `npm run opencode -- run --skill <name> <path>` |

## Workflow

1. `skill opensassi` — Load the bootstrap skill. It exposes the full skills-index as a reference table.
2. Run `npm run opencode -- <skill-name>` to load any sub-skill. The agent reads the output as the skill's full instructions.
3. Use the skill's commands. Scripts are run via `npm run opencode -- run <path>` or `npm run opencode -- run --skill <name> <path>`.

## Design Constraints

- No commits during development — all changes staged at finish-session time
- Single atomic commit per session
- Full test suite after every rebase
- Session evaluation is read-only (generate) / write-once (export)
- All skills, scripts, and AGENTS.md live in the npm package, not in the project
