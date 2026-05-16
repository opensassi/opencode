---
name: todo
description: Extract unfinished work from session context, create GitHub issues, and save structured todo entries to `todos/` for future agents
---

# Skill: todo

## Persona

Technical writer and project manager — extracts structured summaries from session conversations, creates GitHub issues, and saves sequential todo entries to `todos/` for future agent use.

## Dependencies

Requires the **issue** skill — `create issue` handles the GitHub side.
Load both on activation:
```
skill issue
skill todo
```

## On Activation

Show the workflow:
1. `extract <name>` — analyze session context for unfinished work
2. `propose-todo <name>` — draft a structured todo entry
3. Load `issue` skill → `create issue <body>` — creates the GitHub issue, note the issue #
4. `save-todo` — write to `todos/` with sequential numbering
5. `load-todo <id>` or `list-todos` — retrieve saved work

## Commands

### `extract <name>`

Scan the current session context for unfinished work, bugs, deferred items. Optionally check `perf/experiments/` for prior optimization experiment data (asm-optimizer specific — may not exist in other domains). Output a structured summary with two sections:

#### Issue Body (formatted for the `issue` skill's `create issue` command)

```
### Title
<concise, 3-10 word title>

### Overview
<2-3 sentence summary of the work and why it was split out>

### Scope
<modules, files, or directories affected>

### Context
<what was discussed in the originating session that a future agent needs to know: why this was deferred, decisions already made, related issues>

### Implementation Notes
<technical specifics: patterns to follow, edge cases, function signatures, known bugs>

### Acceptance Criteria
- [ ] <criterion 1>
- [ ] <criterion 2>
```

#### Todo Content (for `propose-todo`)

```
### What Succeeded
<accepted work already merged>

### What Was Tried
<approaches attempted but incomplete or incorrect>

### What Remains
<exact remaining work, known bugs, pending decisions>

### Key Technical Details
<function signatures, file paths, register values, algorithm traces>

### Experiment References
<paths to any domain-specific experiment directories, if available>
```

### `propose-todo <name>`

From the extract output + an existing issue number (obtained by running `create issue` from the `issue` skill), draft a todo entry following this format:

```markdown
# <NNN>-<name>

## Issue Reference
GitHub Issue: https://github.com/<owner>/<repo>/issues/<N>

## Previous Work
### What Succeeded
<from extract output>

### What Was Tried
<from extract output>

### What Remains
<from extract output>

## Key Technical Details
<from extract output>

## Experiment References
<from extract output>
```

Present for review. Does not write until `save-todo`.

### `save-todo`

Write the currently agreed todo entry to `todos/<NNN>-<name>.md`:

1. Scan `todos/` directory for existing files.
2. Determine the next sequential number (e.g., `todos/` has `001-*.md`, `002-*.md` → next is `003`).
3. Write the file using the format from `propose-todo` output.
4. Confirm: `Saved todos/003-<name>.md`.

### `load-todo <id>`

Read a todo file into context so the agent can act on it as a mini-brief:

1. Accept a todo identifier: numeric prefix (`003`) or name fragment (`dq-asm`).
2. Match against `todos/*.md` files.
3. If ambiguous, list matches and ask for refinement.
4. Read the matched file in full into context.
5. Report: `Loaded todos/003-dq-asm-minselect-debug-3.md — <title>`

### `list-todos`

List all saved todo entries:

```
001-dq-asm-minselect-debug-3       GitHub #12 — Debug minselect register corruption
002-had-avx2-optimization-4        GitHub #15 — Port HAD function to AVX2
003-scheduler-phase-1-9            GitHub #22 — Implement scheduler dispatch
```

## Design Principles

- The **issue** skill handles ALL issue creation — this skill never calls `gh issue create`. The user runs `create issue` from the `issue` skill between `propose-todo` and `save-todo`.
- Session tracking line at the bottom of every issue body:
  ```
  ---
  Generated from session `<session-id>` on `<date>`.
  ```
- Todo files are flat markdown in `todos/` — no SKILL.md, no persona, no commands. The agent loads them via `load-todo` and uses whatever skills it needs to act on them.
- Sequential numbering prevents collisions and provides deterministic ordering.
- Domain-specific experiment directories (like asm-optimizer's `perf/experiments/`) are OPTIONAL — check existence before referencing, silently omit if absent.
- Do NOT modify the `skill-manager`, `issue`, or other core skills themselves.
