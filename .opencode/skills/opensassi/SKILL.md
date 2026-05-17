---
name: opensassi
description: Bootstrap a new project environment — detect OS, install toolchain (git, Node.js via nvm/LTS), clone FlameGraph, set up project infrastructure
---

# Skill: opensassi

## Plan Mode

When the agent is in plan mode, `npx @opensassi/opencode <skill-name>` is explicitly permitted by `.opencode/opencode.json`. Use it freely to load skills and spec files into context during read-only analysis. No other bash commands are allowed in plan mode.

## Persona

Senior DevOps engineer specializing in cross-platform development environment provisioning, with deep expertise in nvm, package managers (apt/dnf/yum/pacman/brew/choco), and build toolchain setup.

## On Activation

1. Load `system-design` via `npx @opensassi/opencode system-design`.
2. Follow the system-design skill's `load-spec --depth 2` instructions.
3. Read the `## Lexicon` section below and present every skill, command, and description.
   Do not summarize — read it directly from the table.

To load a sub-skill (e.g., system-design, git, profiler), the agent should run:
```
npx @opensassi/opencode <skill-name>
```
and read the output as the skill's full instructions.
*Local development: use `npm run opencode -- <skill-name>` when working in the opensassi repo itself.*

## Dependencies

- `bash` or `powershell` (for bootstrap scripts — zero other deps)
- `git` (installed by bootstrap if missing)
- The `@opensassi/opencode` npm package (scripts resolve via `npx @opensassi/opencode run --skill opensassi <name>`)

## Commands

### `init`

Execute companion scripts from the `@opensassi/opencode` package. If a script is missing or a platform installer does not exist, report the gap and continue; do not generate files.

1. `npx @opensassi/opencode run --skill opensassi env-check.sh` (or `env-check.ps1` on Windows) — bootstrap git + Node.js LTS (creates `.nvmrc` if missing)
2. `init-install` — run existing platform installer, or report if none found
3. `init-flamegraph` — clone FlameGraph v1.0
4. `npx @opensassi/opencode run --skill opensassi install-npm-deps.sh` — `npm install`
5. `npx @opensassi/opencode run --skill opensassi ensure-gitignore.sh` — append common patterns

### `init-install`

Install the development environment toolchain.

**Flow:**

1. **Detect environment** — run `npx @opensassi/opencode run --skill opensassi env-check.sh` (Linux/macOS/WSL/Git Bash) or fall back to `env-check.ps1` (Windows native). Both output structured JSON.
2. **Check for existing installer** — look for `npx @opensassi/opencode run install.sh` for platform-specific installers from the package's `scripts/install/` directory
3. **If installer exists** — run it (installs: cmake, nasm, gdb, ripgrep, perf, htop, etc.)
4. **If installer NOT found**:
   a. Report: "No installer found for this platform"
   b. Continue — env-check already installed git + Node.js, which is sufficient for the project to function

### `init-flamegraph`

Clone Brendan Gregg's FlameGraph at pinned tag `v1.0` to `scripts/FlameGraph/`:
- If `scripts/FlameGraph/` does not exist: `git clone --depth=1 --branch v1.0`
- If it exists: `git fetch --tags --depth=1 && git checkout v1.0`

### `init-check`

Run `npx @opensassi/opencode run --skill opensassi env-check.sh` (or `env-check.ps1`) and verify:
- Node.js version (LTS or later)
- git availability
- FlameGraph presence at `scripts/FlameGraph/`
- npm deps installed (`node_modules/` exists)
- `.gitignore` has common patterns

### `show-commands`

Generate the command overview from the `## Lexicon` table in this file. List every skill, its commands, arguments, and descriptions. Present the full table — do not summarize.

This does not run any external commands. All data is in the Lexicon table already loaded in context.

## Lexicon

| Skill | Command | Arguments | Description |
|-------|---------|-----------|-------------|
| **system-design** | `load-spec` | `[--depth 1-4]` | Load spec tree into context (tail — permanent base) |
| | `generate-from-source` | — | Build spec tree from source files |
| | `generate-technical-specification` | — | Produce complete class spec + diagrams + test plan |
| | `revise-technical-specification` | — | Propose structured revisions list |
| | `generate-sequence-diagram` | — | Mermaid sequence diagram for data flow |
| | `generate-architecture-diagram` | — | Mermaid C4 container/component diagram |
| | `generate-class-specification` | — | Complete C++ class declarations |
| | `generate-d3-animation` | — | Self-contained HTML D3.js animation |
| | `generate-testing-plan` | — | Structured unit/integration/regression tests |
| | `split-sub-modules` | — | Break monolithic spec into sub-module directory |
| | `combine-sub-modules` | — | Flatten sub-module spec back to monolithic |
| | `list-sub-modules` | — | List all sub-modules with facade classes |
| | `load-sub-module-spec` | `<path>` | Load one sub-module `.spec.md` |
| | `generate-sub-module-spec` | `<name>` | Generate `.spec.md` for a named sub-module |
| | `list-external` | — | List external integration pairs in `external/` |
| | `load-external` | `<name>` | Load an external project's spec tree into context |
| | `staleness-check` | — | Check for specs with missing or outdated reviews |
| **git** | `start-session` | — | `git checkout main` → `git pull --rebase`, verify clean tree |
| | `finish-session` | — | add → commit → rebase → test → eval → push (single atomic commit) |
| | `sync` | — | `git fetch origin` → `git rebase origin/main` → test |
| **issue** | `create-issue` | `<body>` | Create GitHub issue from structured body |
| | `list-issues` | `[--limit N]` | List recent GitHub issues |
| | `show-issue` | `<number>` | Show issue details and status |
| | `close-issue` | `<number>` | Close issue with comment |
| **npm-optimizer** | `execute` | — | Full port pipeline: discover → ceiling → naive → profile → classify → pivot/micro → shim → report |
| | `assess-ceiling` | — | Build N-API pass-through, measure upper bound |
| | `implement-naive` | — | Scaffold simplest C++ addon passing 100% tests |
| | `classify` | — | Sort perf samples Tier 1/2/3, decide pivot vs micro |
| | `pivot` | — | Architectural pivot when N-API/V8 is bottleneck |
| | `micro-optimize` | — | Iterative C++ micro-opt with 3-strikes rule |
| | `shim` | — | JS compatibility wrapper + cross-reference docs |
| | `bench` | — | Benchmark against original JS baseline |
| | `assess-handoff` | — | Gate: evaluate dropping to asm-optimizer |
| | `report` | — | Final comparison table + archive |
| | `show-state` | — | Pipeline progress |
| **profiler** | `check` | — | Verify perf toolchain available |
| | `setup` | `[--frames N]` | Download test data, prepare profiling environment |
| | `profile` | `[--events ...]` | `perf record` → flamegraph |
| | `benchmark` | `[--iter N]` | Run N iterations with metric collection |
| | `compare` | `<baseline> <candidate>` | Side-by-side benchmark comparison |
| | `report` | `[--profile <label>]` | Bundle profiling session into report |
| **asm-optimizer** | `setup-baseline` | — | Create baseline dirs, clone release, build, run profiling matrix |
| | `profile` | `<name>` | Maximal perf counter dump against baseline |
| | `assess` | `<entry>` | Evaluate one function's ASM optimization potential |
| | `assess-all` | — | Rank all candidate functions by potential |
| | `setup-microbench` | `<entry>` | Create isolated microbenchmark harness |
| | `spec` | `<entry>` | Generate technical spec of C++ implementation |
| | `analyze-gap` | `<entry>` | Compare ASM implementation against C++ spec |
| | `bench` | `<entry>` | Run microbenchmark, compare against C++ baseline |
| | `implement` | `<entry>` | Generate ASM implementation following spec-first process |
| | `iterative-optimize` | `<entry>` | Full optimization pipeline with experiment archiving |
| | `archive-experiment` | `<entry>` | Save experiment record when hypothesis fails |
| | `report` | `[--format markdown\|json]` | Optimization report for all assessed entries |
| **todo** | `extract` | `<name>` | Scan session context for unfinished work → structured summary |
| | `propose-todo` | `<name>` | Draft todo entry from extract output |
| | `save-todo` | — | Write to `todos/<NNN>-<name>.md` |
| | `load-todo` | `<id>` | Read todo file into context for agent to act on |
| | `list-todos` | — | List all saved todo entries |
| **session-evaluation** | `generate` | — | Analyze conversation, produce structured session evaluation |
| | `export` | — | Save evaluation + compressed session archive to `sessions/` |
| **skill-manager** | `show-skills` | — | List all registered skills |
| | `create-skill` | — | Interactive skill creation flow |
| | `revise-skill` | `<name>` | Interactive skill revision |
| | `save-skill` | — | Write skill to disk + register |
| | `delete-skill` | `<name>` | Remove skill from disk |
| | `commit` | — | Stage + commit all skill changes |
| | `audit-skills` | — | Validate all skill files for consistency |
| **system-design-review** | *(no commands defined)* | — | Seven-expert panel audit of technical specs |
| **demo-video** | `plan` | — | Generate scene file from project outline |
| | `record` | — | Capture terminal + browser scenes as video clips |
| | `produce` | — | TTS audio, subtitles, ffmpeg assembly → final MP4 |
| **daily-evaluation** | *(no commands defined)* | — | Aggregate session evaluations into dashboards |
| **opensassi** | `show-commands` | — | Generate the command overview from the Lexicon table and present it |

## Design Principles

- **No circular dependencies on Node.js** — Bootstrap scripts use only bash or PowerShell. Node.js is installed BY the bootstrap.
- **nvm is additive, not destructive** — `nvm install --lts` installs alongside existing Node versions. `nvm use --lts` scopes to the current shell only. System default node is never touched.
- **`.nvmrc` for the project** — Written with `--lts` so `nvm use` auto-selects when entering the project directory.
- **FlameGraph pinned at v1.0** — Tag is stable; pinned clones are idempotent.
- **`install.ps1` is WSL-only** — Not modified by this skill. Windows-native installer is a future extension.
- **env-check scripts output JSON** — Structured `{os, distro, version, codename, pkg_manager, shell, is_wsl, arch, node_version, nvm_version, git_version}` for AI agent consumption.
