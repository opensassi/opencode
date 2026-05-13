# opencode Agent Instructions

This is the **opencode project template** — a meta-repository (agent harness), not an application codebase. Skills in `.opencode/skills/<name>/SKILL.md` give the agent domain-specific expertise on demand via `skill <name>`.

## 1. Mandatory: Load System Design

At the start of every session, load `skill system-design`. This agent drives the entire workflow — it reads `technical-specification.md`, iterates on design through clarifying questions, and generates class specifications, architecture/sequence diagrams, D3 animations, and testing plans via the propose-revise-generate loop. All other skills (git, session-evaluation, profiler, etc.) serve this primary workflow.

## 2. Skill System

All skills are registered with `"allow"` in `.opencode/opencode.json`. Load on demand:

| `skill` | Use case |
|---------|----------|
| `asm-optimizer` | SIMD/assembly optimization framework |
| `daily-evaluation` | Aggregate session evaluations into dashboards |
| `git` | Rebase-based single-commit-per-session workflow |
| `opensassi` | Bootstrap a new project environment |
| `issue` | GitHub issue management (requires `gh` CLI) |
| `profiler` | Linux perf profiling + flamegraphs |
| `session-evaluation` | Generate structured session reports |
| `skill-manager` | Create/revise skills interactively |
| `system-design` | Interactive C++ spec authoring with diagrams |
| `system-design-review` | Seven-expert panel audit of technical specs |
| `todo` | Create issues + debugging skills from session context |

## 3. Git & Session Workflow

**Always load `skill git` before finishing a session.** The workflow is:

1. **`start session`** — checkout main, pull --rebase, verify clean tree
2. **Develop** (no commits during development — `git add -A` only at finish time)
3. **`finish session`** — orchestrates: `git add -A` → generate eval title slug + session ID → commit with message `<title-slug>-<session-id-noprefix>` → rebase onto `origin/main` → run tests → if fail: fix + amend + re-rebase → write evaluation sidecar → export session archive → amend artifacts → push
4. Commit message format: `<title-slug>-<session-id-noprefix>` (single line, no body)
5. Rebasing only — never merge. Conflicts: resolve → `git add` → `git rebase --continue`
6. Session archives go to `sessions/` as `.md` + `.json.bz2` + `.sha256`

## 4. MCP Tools

Configured in `.opencode/opencode.json`:

- **Playwright** (`npx @playwright/mcp@latest --headless`) — browser automation
- **GDB Debugger** (`gdb-mcp-server`) — C/C++ headless debugging via GDB/MI

## 5. npm Scripts (Artifact Pipeline)

```
npm run extract          # Extract diagrams from technical-specification.md
npm run test-artifacts   # Validate artifacts (SVG, PNG, D3 keyframes)
npm run validate-all     # extract --all + test-artifacts
npm run verify-animation -- --file <path>   # D3 keyframe verification
npm run check-artifacts  # Staleness check
```

## 6. Environment & Setup

- Run `skill opensassi init` to bootstrap the development environment

## 7. Watcher & Gitignore

Root `opencode.json` ignores `sessions/**`, `node_modules/**`, `thirdparty/**`, `test/data/**`. The gitignore lives at `.gitignore` (project-wide) plus `.opencode/.gitignore` (opencode-internal). Key patterns: `/.artifacts/`, `.playwright-mcp/`, `.profiler/`, `sessions/` (except `.gitkeep` and `export-session.sh`), `scripts/FlameGraph/`.

## 8. Design Constraints

- **No commits during development** — all changes staged at `finish session` time
- **Single atomic commit per session** — use `git commit --amend --no-edit` for test-fix loops
- **Full test suite after every rebase** — if tests fail, fix → amend → re-rebase
- **Session evaluation is read-only** — `generate` does not write files; `export` writes to `sessions/`
- **`skill-manager` reads skills with `read` tool** — never uses `skill` to load other skills
- **Title slugs are lower-dash-case** (e.g. `2026-05-11-my-project-setup`)
- **`ses_` prefix stripped** from session IDs for filenames
