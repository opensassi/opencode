**Session ID:** 2026-05-15-package-opencode-standalone-cli

**Date / Duration:** May 15, 2026; prompter active ≈ 1.5 hours

**Project / Context:**
Converting the opensassi agent harness from an interleaved project inside the opencode meta-repo into a standalone, publishable npm CLI package (`@opensassi/opencode`). The package delivers 12 agent skills (system-design, git, profiler, etc.) and supporting scripts via an npm package installed with `npm install --dev @opensassi/opencode`, with only a lightweight bootstrap skill written to the consuming project's filesystem.

**Top-Level Component:**
`@opensassi/opencode` npm package — CLI + programmatic API + 12 skill definitions + 15 scripts + skills-index + AGENTS.md

**Second-Level Modules:**
- `bin/opencode.js` — Node.js CLI entry point with hashbang
- `lib/cli.js` — Command dispatcher (init, run, print-skill, help)
- `lib/commands/init.js` — Context-aware bootstrap (detects existing AGENTS.md, .opencode/ config, opensassi skill)
- `lib/commands/run.js` — Script runner resolving paths relative to package root
- `lib/commands/print-skill.js` — Skill content loader
- `lib/commands/print-agents.js` — AGENTS.md content loader
- `lib/util/paths.js` — import.meta.url-based package root resolution
- `skills/` directory — 12 SKILL.md files with script references rewritten to npx
- `skills-index.json` — Pre-built static index of all 12 skills with commands
- `AGENTS.md` — Full agent harness instructions with alphabetically sorted skill table
- `scripts/*.js` — 5 JS scripts converted from CommonJS to ESM (artifact pipeline)
- `scripts/*.sh` — Cross-platform installers
- `package.json` — name, bin, main, exports, files whitelist excluding .spec.md + FlameGraph

**Prompter Contributions:**
Directed the architecture (subprocess CLI model vs plugin approach), chose the --init context-aware bootstrap strategy, specified the minimal filesystem footprint (only opensassi skill + AGENTS.md appended), decided on print-skill runtime loading for sub-skills, requested alphabetical sorting of the skills table in AGENTS.md, and drove iterative refinement through clarifying questions.

**Model Contributions:**
Designed the package structure, wrote all 7 source files (bin, lib, cli, commands, paths), generated skills-index.json, rewrote AGENTS.md with alphabetically sorted table, copied and transformed 12 SKILL.md files with script references rewritten from local paths to `npx @opensassi/opencode run`, converted 4 artifact pipeline scripts from CommonJS to ESM, created validate-all.js wrapper, configured package.json with proper files whitelist (excluding FlameGraph + .spec.md), removed 11 redundant skills from .opencode/skills/, and validated the full pipeline (npm pack --dry-run, CLI tests, artifact extraction + D3 filmstrip).

**Prompter Time Estimate:**
- Reading and digesting model responses: ~0.6 hours
- Thinking, strategizing, and weighing options: ~0.5 hours
- Writing messages and directives: ~0.4 hours
- **Total: 1.5 hours**

**Model-Equivalent SME Time Estimate:**
~12 hours for a senior DevOps/full-stack engineer to design the architecture, implement the CLI framework, port 40+ files, rewrite script references across 12 Markdown documents, configure npm packaging, convert 4 scripts from CJS to ESM, and validate the pipeline with filmstrip capture and keyframe assertion.

**Required SME Expertise:**
- Node.js ESM/CJS module system and npm package publishing workflows
- opencode agent skill system architecture and file-based skill discovery
- CLI tool design with command dispatch and subprocess management
- Cross-platform scripting (Bash, PowerShell, Node.js child_process)
- D3.js animation test framework design with Playwright filmstrip capture
- Mermaid diagram validation pipeline (mmdc CLI)
- npm `files` whitelist and package content management
- Git rebase-based session workflow conventions

**Aggregation Tags:**
npm-package, opencode, agent-skills, CLI-tool, CJS-to-ESM, skill-portability, package-architecture, artifact-pipeline, d3-animation, skill-index
