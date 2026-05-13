---
name: init
description: Initialize a new opencode project — detect environment, install bootstrapping toolchain (git, Node.js via nvm/LTS), generate platform installers, clone FlameGraph, and set up project infrastructure
---

# Skill: init

## Persona

Senior DevOps engineer specializing in cross-platform development environment provisioning, with deep expertise in nvm, package managers (apt/dnf/yum/pacman/brew/choco), and build toolchain setup.

## On Activation

1. Run `init check` to report current environment status (OS, Node.js, git, FlameGraph, npm deps)
2. Show available commands

## Critical: Never Overwrite Existing Files

The init skill must NEVER modify, overwrite, or regenerate any existing project file. This includes AGENTS.md, README.md, SKILL.md files, source code, config files, or any other file that already exists on disk. The only permitted writes are:

- **`scripts/FlameGraph/`** — clone or update (git-controlled, pinned to v1.0)
- **`.gitignore`** — may append missing patterns via `ensure-gitignore.sh` (idempotent, no-op if present)
- **`scripts/install/<os>/<distro>-<version>/install.sh`** — only when the file does not yet exist AND user has confirmed
- **`scripts/install.sh`** — only to append a new case entry (insert before `esac`) for a newly generated installer
- **`node_modules/`** — managed by npm, never committed

If a file exists, skip it. If unsure whether something should be written, abort and tell the user.

## Dependencies

- `bash` or `powershell` (for bootstrap scripts — zero other deps)
- `git` (installed by bootstrap if missing)
- Companion scripts in `.opencode/skills/init/scripts/`

## Commands

### `init`

Run the full initialization pipeline. **Never modifies existing project files** (AGENTS.md, README.md, source code, configs). Only creates new files or appends to `.gitignore`.

1. `env-check.sh` (or `env-check.ps1` on Windows) — bootstrap git + Node.js LTS via nvm
2. `init install` — find/generate and run the platform installer
3. `init flamegraph` — clone FlameGraph v1.0
4. `install-npm-deps.sh` — `npm install`
5. `ensure-gitignore.sh` — add common patterns

### `init install`

Install the development environment toolchain.

**Flow:**

1. **Detect environment** — run `env-check.sh` (Linux/macOS/WSL/Git Bash) or fall back to `env-check.ps1` (Windows native). Both output structured JSON.
2. **Check for existing installer** — look for `scripts/install/<os>/<distro>-<version>/install.sh` (or `install.ps1` for WSL)
3. **If installer exists** — run it (installs: cmake, nasm, gdb, ripgrep, perf, htop, etc.)
4. **If installer NOT found**:
   a. Find nearest match in `scripts/install/` tree based on OS family
   b. Adapt the full template: package manager equivalents, tool names, node install approach
   c. Present proposed `install.sh` content + `install.sh` dispatch edit to user for confirmation
   d. On confirm:
      - Write `scripts/install/<os>/<distro>-<version>/install.sh`
      - Append new case entry to `scripts/install.sh` (insert before the final `esac`)
      - Run the new installer

### `init flamegraph`

Clone Brendan Gregg's FlameGraph at pinned tag `v1.0` to `scripts/FlameGraph/`:
- If `scripts/FlameGraph/` does not exist: `git clone --depth=1 --branch v1.0`
- If it exists: `git fetch --tags --depth=1 && git checkout v1.0`

### `init check`

Run `env-check.sh` (or `env-check.ps1`) and verify:
- Node.js version (LTS or later)
- git availability
- FlameGraph presence at `scripts/FlameGraph/`
- npm deps installed (`node_modules/` exists)
- `.gitignore` has common patterns

## Design Principles

- **Never overwrite existing files** — AGENTS.md, README.md, source code, SKILL.md files, configs, and any other pre-existing file must never be modified. The only writes permitted are: creating new files (platform installers), appending to `.gitignore`, and managing `scripts/FlameGraph/` (git clone/checkout).

- **No circular dependencies on Node.js** — Bootstrap scripts use only bash or PowerShell. Node.js is installed BY the bootstrap.
- **nvm is additive, not destructive** — `nvm install --lts` installs alongside existing Node versions. `nvm use --lts` scopes to the current shell only. System default node is never touched.
- **`.nvmrc` for the project** — Written with `--lts` so `nvm use` auto-selects when entering the project directory.
- **Install scripts are full Ubuntu-style templates** — apt update → install packages → verify tools. Each platform follows the same structural pattern.
- **New platforms are appended** — When generating an installer, the dispatch entry is appended to `scripts/install.sh` *before* the final `esac`, never inserted mid-file (avoids merge conflicts).
- **User must confirm** — Any auto-generated installer is presented to the user for approval before writing to disk.
- **FlameGraph pinned at v1.0** — Tag is stable; pinned clones are idempotent.
- **`install.ps1` is WSL-only** — Not modified by this skill. Windows-native installer is a future extension.
- **env-check scripts output JSON** — Structured `{os, distro, version, codename, pkg_manager, shell, is_wsl, arch, node_version, nvm_version, git_version}` for AI agent consumption.
