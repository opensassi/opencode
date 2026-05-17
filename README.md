# @opensassi/opencode

Agent skill harness for AI-assisted software development. Delivers 13 domain-specific skills (system-design, git workflow, profiling, etc.) and supporting scripts as a standalone npm CLI package.

```
npx @opensassi/opencode init
```

## Installation

```bash
npm install --dev @opensassi/opencode
```

Then bootstrap a project to make its skills available to opencode:

```bash
npx opencode init
```

This writes three files to your project:
- **`AGENTS.md`** — appends full opensassi agent instructions
- **`.opencode/skills/opensassi/SKILL.md`** — bootstrap skill (the only skill on disk)
- **`.opencode/opencode.json`** — permission rules + MCP server config

All other skills (system-design, git, profiler, etc.) are loaded at runtime via the CLI.

## CLI Commands

```
npx @opensassi/opencode init                    # Bootstrap project
npx @opensassi/opencode <skill-name>             # Print skill instructions to stdout
npx @opensassi/opencode run <path> [args...]     # Run a script from the package
npx @opensassi/opencode run --skill <n> <path>   # Run a skill-specific script
npx @opensassi/opencode help                     # Show help
```

## Skills

| Skill | Purpose |
|-------|---------|
| `asm-optimizer` | SIMD/assembly optimization framework |
| `daily-evaluation` | Aggregate session evaluations into dashboards |
| `git` | Rebase-based single-commit-per-session workflow |
| `issue` | GitHub issue management |
| `npm-optimizer` | Port an npm package to a C++ native addon — 100% test compatibility through profiling-driven iteration |
| `opensassi` | Bootstrap a new project environment |
| `profiler` | Linux perf profiling + flamegraphs |
| `session-evaluation` | Generate structured session reports |
| `skill-manager` | Create/revise skills interactively |
| `system-design` | Interactive C++ spec authoring with diagrams |
| `system-design-review` | Seven-expert panel audit of technical specs |
| `todo` | Create issues + debugging skills from session context |

## Package Contents

| Directory | Contents |
|-----------|----------|
| `bin/` | CLI entry point (`opencode` binary) |
| `lib/` | Programmatic API + command implementations |
| `skills/` | 13 skill definitions (SKILL.md) + skill scripts |
| `scripts/` | Artifact pipeline (extract, test, verify, check) + installers |
| `AGENTS.md` | Agent harness instructions (appended by init) |
| `skills-index.json` | Pre-built static skill/command index |

## Development

```bash
git clone git@github.com:opensassi/opencode.git
cd opencode
node bin/opencode.js help
npm pack --dry-run     # Review package contents
npm run validate-all   # Full artifact pipeline test
```

## Design

- **Minimal filesystem footprint** — `init` writes only 3 files. All sub-skills load from the npm package at runtime.
- **opencode-agnostic** — The CLI works stand-alone. Skills are consumed by opencode but the package doesn't depend on it.
- **Runtime skill loading** — Sub-skills are never on disk; the agent loads them by running `npx @opensassi/opencode <name>`.
- **Programmatic API** — `import { init, run, printSkill } from '@opensassi/opencode'`
