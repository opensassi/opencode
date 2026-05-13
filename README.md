# opencode Project Template

A forkable project skeleton for AI-assisted software development using [opencode](https://opencode.ai) with an integrated skill system.

## What This Is

This repository provides the agent harness infrastructure — a self-contained set of skills, scripts, and agent instructions that enable AI development agents to work on your project with domain-specific expertise. When you fork this repo, you get:

- **Skills** — Modular capability packs (system design, profiling, code review, issue management, session tracking)
- **Artifact Pipeline** — Extract and validate Mermaid diagrams and D3 animations from technical specifications
- **Session Management** — Archive and evaluate AI-assisted development sessions
- **Install Scripts** — Cross-platform (Linux, macOS, WSL2) toolchain setup
- **Git Workflow** — Rebase-based single-commit-per-session development loop

## Directory Structure

```
opencode/
├── AGENTS.md                     # Agent instructions (the entry point for AI agents)
├── README.md                     # This file
├── package.json                  # npm scripts for artifact pipeline
├── opencode.json                 # opencode project configuration
├── .gitignore                    # Project-wide gitignore
├── .opencode/
│   ├── opencode.json             # MCP tools + skill permissions
│   ├── .gitignore                # opencode-internal gitignore
│   └── skills/                   # Skill definitions (one directory per skill)
│       ├── skill-manager/        # Create, revise, and maintain skills
│       ├── system-design/        # Interactive system design with diagrams
│       ├── system-design-review/ # Panel-based specification auditing
│       ├── session-evaluation/   # Session analysis and archiving
│       ├── git/                  # Rebase-based git workflow
│       ├── profiler/             # Linux perf profiling + flamegraphs
│       ├── issue/                # GitHub issue management
│       ├── todo/                 # Create issues and debugging skills from context
│       ├── asm-optimizer/        # SIMD assembly optimization framework
│       └── daily-evaluation/     # Aggregate session evaluations into dashboards
├── scripts/
│   ├── extract-artifacts.js      # Extract diagrams from spec files
│   ├── test-artifacts.js         # Validate extracted artifacts
│   ├── check-artifacts.js        # Check artifact staleness
│   ├── verify-artifact.js        # Verify D3 animation keyframes
│   ├── puppeteer-config.json     # Mermaid renderer configuration
│   ├── install.sh                # OS detection and toolchain install
│   ├── install.ps1               # Windows WSL2 installer
│   ├── install/                  # Platform-specific install scripts
│   └── asm-optimizer/            # ASM optimization support scripts
└── sessions/
    ├── export-session.sh         # Session archive script
    └── daily/                    # Daily evaluation dashboards
```

## Getting Started

### 1. Fork This Repository

```bash
git clone <your-fork-url>
cd opencode
```

### 2. Install Prerequisites

```bash
# Linux (Ubuntu 24.04):
bash scripts/install.sh

# macOS:
bash scripts/install.sh

# Windows (WSL2, as Administrator):
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

The installer sets up: `build-essential`, `cmake`, `nasm`, `git`, `nodejs/npm`,
`perf`, `gdb`, `ripgrep`, `fd`, `bat`, `htop`, `jq`, `tmux`, and more.

### 3. Install npm Dependencies

```bash
npm install
```

### 4. Initialize Your Project

Replace the template content with your actual project source code. The skills are designed to be language- and domain-agnostic — adapt the `technical-specification.md` workflow to your needs.

### 5. Start Working

Launch opencode in the project root and the agent will automatically read `AGENTS.md` for instructions.

## Working with Skills

Skills are loaded on demand via the `skill` tool:

```
skill git               # Load the git workflow skill
skill system-design     # Load the system design skill
skill profiler          # Load the profiling skill
```

Each skill exposes domain-specific commands. After loading a skill, the agent will show available commands.

### Creating New Skills

Use the `skill-manager` skill to create new skills interactively:

```
skill skill-manager
create skill  # Describe your skill in natural language
```

Skills are saved to `.opencode/skills/<name>/SKILL.md` and registered in `.opencode/opencode.json`.

## Artifact Pipeline

The artifact pipeline extracts Mermaid diagrams and D3 animations from markdown spec files:

```bash
# Extract artifacts from technical-specification.md
npm run extract

# Validate extracted artifacts
npm run test-artifacts

# Full pipeline (extract + validate)
npm run validate-all

# Per-file (faster, for single spec files)
node scripts/extract-artifacts.js --file technical-specification.md
node scripts/test-artifacts.js --file technical-specification.md
```

## Session Workflow

Development follows a single-commit-per-session rebase workflow:

1. `skill git` → `start session` — checkout main, pull latest
2. Make changes
3. `finish session` — stage, commit, rebase, test, evaluate, push

Session evaluations are saved to `sessions/` as compressed JSON archives with markdown sidecars and integrity hashes.

## Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm run extract` | Extract artifacts from technical-specification.md |
| `npm run test-artifacts` | Validate all extracted artifacts |
| `npm run validate-all` | Extract --all + test-artifacts |
| `npm run verify-animation -- --file <path>` | Verify D3 animation keyframes |

## Customization

### Configuring MCP Tools

Edit `.opencode/opencode.json` to enable/disable MCP tools (Playwright browser, GDB debugger):

```json
{
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "@playwright/mcp@latest", "--headless"],
      "enabled": true
    }
  }
}
```

### Adding Project-Specific Test Commands

The `git` skill's `finish session` runs a test command before push. Update the skill's `SKILL.md` to point to your project's test runner (e.g., `pytest`, `ctest`, `npm test`).
