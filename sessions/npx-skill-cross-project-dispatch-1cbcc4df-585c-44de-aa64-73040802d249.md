**Session ID:** 2026-05-15-npx-skill-cross-project-dispatch

**Date / Duration:** May 15, 2026; prompter active ≈ 1 hour

**Project / Context:**
Adding cross-project dispatch capabilities to the `@opensassi/opencode` CLI package — a new `npx` skill that allows executing `@opensassi/opencode` commands in a target directory (e.g., `external/` sub-projects) with automatic directory resolution via inference rules and a `list-targets.sh` discovery script.

**Top-Level Component:**
`npx` skill — cross-project CLI dispatch with fuzzy directory resolution

**Second-Level Modules:**
- `skills/npx/SKILL.md` — Agent instructions for target resolution (6 rules: absolute path, exact match, single external heuristic, multiple prompt, last-target cache)
- `scripts/list-targets.sh` — Shell script scanning `external/`, `packages/`, `src/` for candidate directories, outputting JSON
- `skills-index.json` — Added `npx` entry with commands
- `skills/opensassi/SKILL.md` — Updated activation text to list `npx` as a sub-skill
- `lib/commands/init.js` — Added post-write handoff (detect `OPENCODE=1`, spawn `opencode run --print-logs`, or print install instructions)
- End-to-end test: `npx /home/pc/projects/opensassi/tinygrad system-design` — resolved via Rule 1, printed full skill content

**Prompter Contributions:**
Designed the directory resolution rules (external/ priority, exact match, fuzzy fallback), specified hybrid inference + script approach, requested the handoff logic in `init`, tested the npx dispatch on tinygrad, and drove iterative refinement through clarifying questions.

**Model Contributions:**
Wrote `scripts/list-targets.sh` (JSON output, scans 3 directory types), wrote `skills/npx/SKILL.md` (full agent instructions with 6 resolution rules and examples), updated `skills-index.json` with npx entry, updated `skills/opensassi/SKILL.md` activation text, implemented the init handoff logic in `lib/commands/init.js`, and validated the npx dispatch end-to-end on tinygrad.

**Prompter Time Estimate:**
- Reading and digesting model responses: ~0.4 hours
- Thinking, strategizing, and weighing options: ~0.3 hours
- Writing messages and directives: ~0.3 hours
- **Total: 1.0 hours**

**Model-Equivalent SME Time Estimate:**
~6 hours for a senior DevOps/full-stack engineer to design the directory resolution architecture, implement the discovery script, write the skill instructions with 6 resolution rules, add the init handoff with context-aware detection, update the skills index and opensassi activation text, and validate end-to-end on a real target project.

**Required SME Expertise:**
- Shell scripting with JSON output formatting (bash arrays, echo, string concatenation)
- Directory traversal patterns (monorepo structure, external/ convention, workspace discovery)
- CLI dispatch architecture and fuzzy matching heuristics
- opencode skill system and agent instruction design
- opencode environment variable detection (OPENCODE=1, OPENCODE_RUN_ID)

**Aggregation Tags:**
npx, cross-project, directory-resolution, shell-script, skill-design, cli-dispatch, init-handoff, tinygrad, fuzzy-matching
