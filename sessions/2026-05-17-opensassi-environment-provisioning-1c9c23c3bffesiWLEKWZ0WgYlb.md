**Session ID:** 2026-05-17-opensassi-environment-provisioning

**Date / Duration:** 2026-05-17; prompter active ≈ 3 hours

**Project / Context:**
Development and debugging of the @opensassi/opencode npm package — an opencode skill pack for environment bootstrapping, system design, and developer workflow automation.

**Top-Level Component:**
opensassi skill ecosystem — root skill with sub-skill loading, Lexicon-based command reference, and MCP tool documentation.

**Second-Level Modules:**
- On Activation bootstrap (all-skills loading, load-spec depth 2, Lexicon presentation)
- Init command (env-check, platform installer, FlameGraph, npm deps, gitignore)
- show-commands (Lexicon table as command reference)
- load-skill (context repropagation)
- MCP tools documentation (Playwright + GDB Debugger)
- Script path bug fixes (check-artifacts, verify-artifact, test-artifacts, extract-artifacts)

**Prompter Contributions:**
Directed the overall architecture of the opensassi skill, identified bugs in script path resolution and agent instruction following, specified the Lexicon-based command reference approach, and guided the MCP tool documentation.

**Model Contributions:**
Implemented all edits across multiple files (skills/opensassi/SKILL.md, AGENTS.md, AGENTS.init.md, 4 scripts), identified and fixed CWD vs ROOT path bugs, restructured On Activation flow, added Lexicon table to .opencode copy, added show-commands with CLI support.

**Prompter Time Estimate:**
- Reading and digesting model responses: ~1.5 hours
- Thinking, strategizing, and weighing options: ~1.0 hours
- Writing messages and directives: ~0.5 hours
- **Total: 3.0 hours**

**Model-Equivalent SME Time Estimate:**
~12 hours (senior DevOps engineer + full-stack developer: 4h path debugging, 4h skill architecture, 2h documentation, 2h testing)

**Required SME Expertise:**
- Node.js/JavaScript (ESM module system, path resolution)
- opencode CLI architecture (skills, MCP, plan mode)
- Git workflow (single-commit-per-session, rebase)
- Linux environment provisioning (nvm, apt, FlameGraph)

**Aggregation Tags:**
opensassi, opencode, skill-development, path-resolution, MCP, agent-instructions, bootstrap, CLI
