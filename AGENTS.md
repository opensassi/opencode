# opencode Agent Instructions

## Overview

This project uses opencode for AI-assisted software development. The agent harness is organized around **skills** — modular prompt packs in `.opencode/skills/<name>/SKILL.md` that give the AI agent domain-specific expertise on demand.

## How to Use Skills

Skills are loaded in-context via the `skill` tool. For example:
- `skill git` loads the git workflow skill
- `skill system-design` loads the system design skill
- `skill profiler` loads the profiling skill

Each skill defines its own available commands. After loading a skill, the agent will display them.

## Available Skills

| Skill | Description |
|-------|-------------|
| `skill-manager` | Create, revise, and maintain skills interactively |
| `system-design` | Interactive system design agent — class specifications, diagrams, testing plans |
| `system-design-review` | Seven-expert panel audit of technical specifications |
| `session-evaluation` | Generate structured session evaluation reports |
| `git` | Rebase-based git workflow — single atomic commits on main |
| `profiler` | Linux perf profiling, flamegraph generation, benchmarking |
| `issue` | GitHub issue management (create, list, show, close) |
| `todo` | Create linked issues and debugging skills from session context |
| `asm-optimizer` | SIMD/assembly optimization framework |
| `daily-evaluation` | Aggregate session evaluations into daily dashboards |

## Artifact Pipeline

Mermaid diagrams and D3 animations embedded in spec files can be extracted and validated:

```
npm run extract                    # extract artifacts from technical-specification.md
npm run test-artifacts             # validate all extracted artifacts
npm run validate-all               # extract + validate in one step
```

## GDB Debugger MCP

A GDB debugger MCP server is configured in `.opencode/opencode.json`. It provides headless debugging for C/C++ programs via the GDB/MI protocol.

## Git & Session Workflow

CRITICAL: Before any development work, load the `git` skill and follow its commands. Develop directly against `main` with a rebase workflow. At the end of every session, run `finish session` which orchestrates commit → rebase → tests → evaluation → push.

## Dev Environment Setup

### GitHub CLI (for the `issue` skill)

```bash
sudo apt install gh
gh auth login
```

Follow the browser-based OAuth flow or paste a personal access token.

## Customization

To adapt this template to a specific project:

1. **Replace placeholder paths** in skill SKILL.md files with your project's paths
2. **Install dependencies** via `scripts/install.sh`
3. **Update the test command** in the `git` skill to match your test runner
4. **Create a technical-specification.md** using the `system-design` skill
5. **Add project-specific skills** via the `skill-manager` skill
