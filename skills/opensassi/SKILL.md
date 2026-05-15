---
name: opensassi
description: Bootstrap a new project environment — detect OS, install toolchain (git, Node.js via nvm/LTS), clone FlameGraph, set up project infrastructure
---

# Skill: opensassi

## Persona

Senior DevOps engineer specializing in cross-platform development environment provisioning, with deep expertise in nvm, package managers (apt/dnf/yum/pacman/brew/choco), and build toolchain setup.

## On Activation

1. Show the skills-index (from `skills-index.json` or by running `npx @opensassi/opencode opensassi --print-index`)
2. Run `init check` to report current environment status (OS, Node.js, git, FlameGraph, npm deps)
3. Show available commands

To load a sub-skill (e.g., system-design, git, profiler), the agent should run:
```
npx @opensassi/opencode <skill-name>
```
and read the output as the skill's full instructions.

## Dependencies

- `bash` or `powershell` (for bootstrap scripts — zero other deps)
- `git` (installed by bootstrap if missing)
- The `@opensassi/opencode` npm package (scripts resolve via `npx @opensassi/opencode run --skill opensassi <name>`)

## Commands

### `init`

Execute companion scripts from the `@opensassi/opencode` package. If a script is missing or a platform installer does not exist, report the gap and continue; do not generate files.

1. `npx @opensassi/opencode run --skill opensassi env-check.sh` (or `env-check.ps1` on Windows) — bootstrap git + Node.js LTS (creates `.nvmrc` if missing)
2. `init install` — run existing platform installer, or report if none found
3. `init flamegraph` — clone FlameGraph v1.0
4. `npx @opensassi/opencode run --skill opensassi install-npm-deps.sh` — `npm install`
5. `npx @opensassi/opencode run --skill opensassi ensure-gitignore.sh` — append common patterns

### `init install`

Install the development environment toolchain.

**Flow:**

1. **Detect environment** — run `npx @opensassi/opencode run --skill opensassi env-check.sh` (Linux/macOS/WSL/Git Bash) or fall back to `env-check.ps1` (Windows native). Both output structured JSON.
2. **Check for existing installer** — look for `npx @opensassi/opencode run install.sh` for platform-specific installers from the package's `scripts/install/` directory
3. **If installer exists** — run it (installs: cmake, nasm, gdb, ripgrep, perf, htop, etc.)
4. **If installer NOT found**:
   a. Report: "No installer found for this platform"
   b. Continue — env-check already installed git + Node.js, which is sufficient for the project to function

### `init flamegraph`

Clone Brendan Gregg's FlameGraph at pinned tag `v1.0` to `scripts/FlameGraph/`:
- If `scripts/FlameGraph/` does not exist: `git clone --depth=1 --branch v1.0`
- If it exists: `git fetch --tags --depth=1 && git checkout v1.0`

### `init check`

Run `npx @opensassi/opencode run --skill opensassi env-check.sh` (or `env-check.ps1`) and verify:
- Node.js version (LTS or later)
- git availability
- FlameGraph presence at `scripts/FlameGraph/`
- npm deps installed (`node_modules/` exists)
- `.gitignore` has common patterns

## Design Principles

- **No circular dependencies on Node.js** — Bootstrap scripts use only bash or PowerShell. Node.js is installed BY the bootstrap.
- **nvm is additive, not destructive** — `nvm install --lts` installs alongside existing Node versions. `nvm use --lts` scopes to the current shell only. System default node is never touched.
- **`.nvmrc` for the project** — Written with `--lts` so `nvm use` auto-selects when entering the project directory.
- **FlameGraph pinned at v1.0** — Tag is stable; pinned clones are idempotent.
- **`install.ps1` is WSL-only** — Not modified by this skill. Windows-native installer is a future extension.
- **env-check scripts output JSON** — Structured `{os, distro, version, codename, pkg_manager, shell, is_wsl, arch, node_version, nvm_version, git_version}` for AI agent consumption.
