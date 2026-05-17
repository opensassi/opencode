---
name: opensassi
description: Root skill ecosystem — loads system-design + spec tree, routes sub-skill composition, bootstraps environments
---

# Skill: opensassi — Root Skill Ecosystem

> **Invocation note:** Consumers of the published `@opensassi/opencode` package use `npx @opensassi/opencode <cmd>`.

## Entry Point

| Input | Action |
|-------|--------|
| `/opensassi` | Load `skill system-design`, read `technical-specification.md` + spec tree depth 2 (root + facade specs). Report ready. |
| `/opensassi init` | Run `env-check.sh`. Parse JSON result: if node+git+FlameGraph+deps all present → "Already bootstrapped". Otherwise run full bootstrap sequence (env-check → install → flamegraph → npm-deps → gitignore). |
| `/opensassi <skill> <command> [args]` | Load `<skill>` via `npx @opensassi/opencode <skill>`, then run `<command>` with `[args]`. Return result. |

### Spec tree depth

Depth is controlled by `--depth` flag on `load-spec`:
- Depth 1: `technical-specification.md` only
- Depth 2 (default): + sub-module facade `.spec.md` files
- Depth 3: + internal component `.spec.md` files
- Depth 4: + full file-level `.spec.md` tree

## Init

Single shell command: `npx @opensassi/opencode run --skill opensassi env-check.sh`

Returns JSON: `{"os": ..., "distro": ..., "node_version": ..., "git_version": ..., ...}`

**Interpretation:**
```
bootstrapped = (node_version != "" && git_version != "" 
                && scripts/FlameGraph/ exists 
                && node_modules/ exists)
```

If bootstrapped → report "Environment ready." + show node/git versions.  
If not → run full bootstrap:

1. `npx @opensassi/opencode run --skill opensassi env-check.sh` — install git + Node.js LTS if missing, write `.nvmrc`
2. `init-install` — run platform-specific installer (cmake, nasm, gdb, ripgrep, perf, htop, etc.) or report none found
3. `init-flamegraph` — clone FlameGraph v1.0 to `scripts/FlameGraph/`
4. `npx @opensassi/opencode run --skill opensassi install-npm-deps.sh` — `npm install`
5. `npx @opensassi/opencode run --skill opensassi ensure-gitignore.sh` — append common patterns

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

## Composition Patterns

Common requests map to skill compositions. Load order: permanent base (tail) at bottom, JIT skills (head) at top.

| User says | Skill stack (head ← tail) | Commands |
|-----------|---------------------------|----------|
| "start a session" | git → system-design+spec | `start-session` |
| "finish the session" | session-evaluation → git → system-design+spec | `generate` → `finish-session` → `export` |
| "load the last issue" | issue → system-design+spec | `list-issues` → `show-issue <N>` |
| "create an issue from context" | todo → issue → system-design+spec | `extract <name>` → `create-issue <body>` → `save-todo` |
| "show pending todos" | todo → system-design+spec | `list-todos` |
| "load a todo and work on it" | todo → system-design+spec | `load-todo <id>` → agent acts on content |
| "port an npm package" | npm-optimizer → system-design+spec | `execute` |
| "hand off to asm" | asm-optimizer → npm-optimizer → system-design+spec | `assess-handoff` |
| "profile the encoder" | profiler → system-design+spec | `check` → `profile` |
| "optimize a hot function" | asm-optimizer → system-design+spec | `assess <entry>` → `iterative-optimize <entry>` |
| "create a debugging todo" | todo → asm-optimizer → system-design+spec | `extract` → `propose-todo` → `save-todo` |
| "save a note" | todo → system-design+spec | (treat free text as note → `extract` → `propose-todo` → `save-todo`) |
| "create a demo video" | demo-video → system-design+spec | `plan` → `record` → `produce` |

## Interpretation

Parse user text into skill compositions:

1. **Explicit routing** — If prefixed with `/opensassi`, dispatch directly from the Entry Point table.

2. **Keyword matching** — Scan user text for Lexicon command names and skill domains:
   - "issue", "bug", "ticket" → `issue` skill
   - "git", "commit", "push", "rebase" → `git` skill
   - "profile", "perf", "flamegraph" → `profiler` skill
   - "asm", "assembly", "SIMD", "optimize function" → `asm-optimizer` skill
   - "npm", "port", "native addon" → `npm-optimizer` skill
   - "todo", "note", "deferred", "remaining" → `todo` skill
   - "spec", "diagram", "design" → `system-design` skill
   - "session eval", "report card" → `session-evaluation` skill
    - "skill", "manage skills" → `skill-manager` skill
    - "demo", "video", "record", "narration" → `demo-video` skill

3. **Pattern matching** — Match multi-keyword phrases against Composition Patterns. If no direct match, compose by chaining relevant skills.

4. **Unknown requests** — Reference the Lexicon table and ask: "I see you want to [paraphrase]. Do you mean one of these: [list 2-3 matching skills]?"

5. **Permanent base** — Always keep `system-design` + spec tree loaded (tail of context). Only JIT-load the head skills needed for the current task.

## Context Architecture

- **Tail (permanent base):** `system-design` skill + spec tree. Loaded at `/opensassi`. Self-repropagating tokens designed for long-context survival.
- **Head (JIT-loaded):** Specific skill instructions loaded per phase. Strongest attention, loaded last.
- **Sub-agent loading contracts:** When spawning phase sub-agents, load skills in deterministic order for KV cache reuse (detailed in `npm-optimizer` SKILL.md).

## Design Principles

- **No circular dependencies on Node.js** — Bootstrap scripts use only bash or PowerShell. Node.js is installed BY the bootstrap.
- **nvm is additive, not destructive** — `nvm install --lts` installs alongside existing Node versions. `nvm use --lts` scopes to the current shell only. System default node is never touched.
- **`.nvmrc` for the project** — Written with `--lts` so `nvm use` auto-selects when entering the project directory.
- **FlameGraph pinned at v1.0** — Tag is stable; pinned clones are idempotent.
- **`install.ps1` is WSL-only** — Not modified by this skill. Windows-native installer is a future extension.
- **env-check scripts output JSON** — Structured for consumption by the skill's interpretation logic.
