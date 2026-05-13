# Opencode Project Template

A forkable project skeleton for AI-assisted software development using [opencode](https://opencode.ai) with an integrated skill system.

## What This Is

This repository provides the agent harness infrastructure — a self-contained set of skills, scripts, and agent instructions that enable AI development agents to work on your project with domain-specific expertise. When you fork this repo, you get:

- **Skills** — Modular capability packs (system design, profiling, code review, issue management, session tracking)
- **Session Management** — Archive and evaluate AI-assisted development sessions
- **Install Scripts** — Cross-platform (Linux, macOS, WSL2) toolchain setup
- **Git Workflow** — Rebase-based single-commit-per-session development loop

## Getting Started

### 1. Fork This Repository

```bash
git clone <your-fork-url>
```

### 2. Install opencode and Initialize

Install [opencode](https://opencode.ai), then run `/opensassi init` in the project root to bootstrap toolchains and install dependencies.

## Working with Skills

Skills are loaded on demand via slash commands in the opencode CLI:

```
/skills               # Show available skills
/[skill-name]         # Load and run a skill (e.g., /git, /system-design)
```

After loading a skill, use `/[skill-name] show commands` to see available commands.

### Creating New Skills

Use `/skill-manager` to create new skills interactively:

```
/skill-manager
create skill  # Describe your skill in natural language
```

Skills are saved to `.opencode/skills/<name>/SKILL.md` and registered in `.opencode/opencode.json`.

## Session Workflow

Development follows a single-commit-per-session rebase workflow:

1. `/git` → `start session` — checkout main, pull latest
2. Make changes
3. `finish session` — stage, commit, rebase, test, evaluate, push

Session evaluations are saved to `sessions/` as compressed JSON archives with markdown sidecars and integrity hashes.
