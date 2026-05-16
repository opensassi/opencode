**Session ID:** 2026-05-15-readme-update-opencode-template

**Date / Duration:** 2026-05-15; prompter active ≈ 0.5 hours

**Project / Context:**
The opencode agent harness meta-repository — a project that provides domain-specific expertise to an LLM agent through a skill system. Skills are Markdown prompt files in .opencode/skills/<name>/SKILL.md that define agent personas, commands, and workflows.

**Top-Level Component:**
README.md restructuring — removed Directory Structure, Artifact Pipeline, Available npm Scripts, and Customization sections. Simplified Getting Started to fork + /opensassi init. Updated Working with Skills to use opencode slash commands (/skills, /[skill-name]). Title-cased "Opencode".

**Second-Level Modules:**
- Simplified Getting Started to 2 steps (fork, install + init)
- Updated Working with Skills to document /skills and /[skill-name] slash commands
- Removed 4 obsolete sections (Directory Structure, Artifact Pipeline, npm Scripts, Customization)
- Updated Session Workflow to reference /git instead of skill git

**Prompter Contributions:**
Issued detailed README restructuring requirements covering title case, section removals, Getting Started simplification, and slash command documentation.

**Model Contributions:**
Read existing README, planned changes, executed all edits via Write tool, verified final output.

**Prompter Time Estimate:**
- Reading and digesting model responses: ~0.2 hours
- Thinking, strategizing, and weighing options: ~0.1 hours
- Writing messages and directives: ~0.2 hours
- **Total: 0.5 hours**

**Model-Equivalent SME Time Estimate:**
~2.0 hours — a technical writer would need:
- Review current README and plan restructuring (0.75h)
- Draft and apply all section edits (0.75h)
- Verify consistency and formatting (0.5h)

**Required SME Expertise:**
- Technical documentation restructuring
- Markdown formatting
- opencode CLI and skill system familiarity

**Aggregation Tags:**
readme, documentation, restructuring, getting-started, skills, slash-commands, opensassi
