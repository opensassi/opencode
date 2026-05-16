**Session ID:** 2026-05-16-demo-video-skill

**Date / Duration:** 2026-05-16; prompter active ≈ 2.5 hours

**Project / Context:**
Building the `demo-video` skill for the @opensassi/opencode agent-skill framework — a complete pipeline for producing narrated, multi-language demo videos from project outlines. The skill automates terminal TUI capture via `script(1)`, browser interaction capture via Playwright, text-to-speech narration via edge-tts, and final video assembly via ffmpeg with crossfade transitions and SRT subtitles. 30 files changed, 1987 insertions across the skill directory plus registration updates in the framework's skill index, AGENTS.md, opencode.json, and opensassi SKILL.md.

**Top-Level Component:**
The `demo-video` skill — 8 scripts (render-terminal.cjs, render-slide.cjs, capture-html.sh, capture-browser.sh, generate-tts.sh, generate-subs.cjs, assemble.cjs, setup.sh), 9 Jest test files (+ E2E shell test), 3 test fixture files, a 264-line SKILL.md with full agent persona/instructions, and registration wiring (skills-index.json, AGENTS.md table, opensassi SKILL.md command table, opencode.json permission grant, package.json version bump 0.1.5 → 0.2.0).

**Second-Level Modules:**
- SKILL.md — agent persona (senior DevOps/multimedia engineer), dependencies table, scene JSON schema (3 scene types with field specs), 3-phase workflow (plan/record/produce), script reference table, 6 design principles
- `render-terminal.cjs` — accelerates `script --timing` TUI output into styled HTML replay at configurable speed multiplier
- `render-slide.cjs` — generates narration slide HTML with bullet points, custom background/foreground colors, duration metadata
- `capture-html.sh` — launches Playwright headless Chromium, opens HTML file, records viewport as MP4 at given duration
- `capture-browser.sh` — Playwright URL navigation with configurable interaction sequence (click/scroll/type selectors), viewport recording
- `generate-tts.sh` — edge-tts invocation producing MP3 audio from narration text with configurable voice
- `generate-subs.cjs` — generates SRT subtitle files for all target languages with timing derived from scene durations
- `assemble.cjs` — three-mode ffmpeg pipeline: video-only concat, audio-only concat, final mix with crossfade transitions and ffprobe duration verification
- `setup.sh` — dependency checker for ffmpeg (≥6.0), edge-tts, Playwright with install guidance
- `e2e-test.sh` (308 lines) — full end-to-end pipeline test: installs deps, creates synthetic test scenes, exercises plan/record/produce, verifies final MP4
- 9 Jest test files (assemble, capture-browser, capture-html, generate-subs, generate-tts, render-slide, render-terminal, setup, integration) — 48 test cases covering all scripts
- jest.config.cjs, helpers/run-script.js
- Fixtures: demo-scenes.json (3-scene sample), hello.output, hello.timing

**Prompter Contributions:**
Architected the overall skill design: Playwright-first strategy over x11grab/avfoundation screen recording to eliminate platform-specific capture code; multi-language subtitle-first approach (single English audio track + language SRTs) rather than per-language audio tracks; TTS timeline-driven capture where audio duration governs clip padding/trimming; master asset pipeline with ffprobe-based duration verification for robustness. Directed the three-phase workflow decomposition (plan → record → produce). Insisted on cross-platform compatibility (Playwright on Linux/macOS/Windows, no platform-specific dependencies). Caught the `setpts` ratio bug in render-terminal where the PTS factor needed to invert the speed ratio. Specified the `--keep-raw` flag for intermediate asset inspection. Enforced the design principle that clips must be independently capturable for retry without full pipeline re-run.

**Model Contributions:**
Wrote all 1680 lines of new skill code: SKILL.md with 264 lines of structured agent instructions/schema; 8 scripts (152-line assemble.cjs with 3-mode ffmpeg pipeline, 138-line render-terminal.cjs with HTML template and timing parser, 75-line generate-subs.cjs with SRT generation, 64-line capture-browser.sh, 61-line render-slide.cjs, 48-line capture-html.sh, 44-line setup.sh, 28-line generate-tts.sh); 9 Jest test files totalling ~660 lines with 48 test cases; 302-line E2E test script; 3 fixture files; jest config; run-script helper. Wrote registration updates: skill-index.json entry, AGENTS.md table row, opencode.json permission grant, opensassi SKILL.md command table expansion, package.json version bump. Debugged shell quoting issues in capture scripts, setpts duration alignment in render-terminal, and cross-script argument parsing consistency.

**Prompter Time Estimate:**
- Reading and digesting model responses: ~1.0 hours
- Thinking, strategizing, and weighing options: ~0.8 hours
- Writing messages and directives: ~0.7 hours
- **Total: 2.5 hours**

**Model-Equivalent SME Time Estimate:**
~45-60 hours across DevOps engineering (pipeline design, 8 shell/Node scripts), Playwright automation (2 capture scripts), ffmpeg pipeline engineering (assemble.cjs with filters, setpts, crossfade, concat), TTS integration (edge-tts wrapper), Jest test engineering (9 test suites, 48 cases, E2E test), technical writing (264-line SKILL.md with schema docs), and framework registration wiring.

**Required SME Expertise:**
DevOps engineering, shell scripting (bash/POSIX), ffmpeg pipeline architecture (filters, setpts, concat, crossfade, ffprobe), Playwright browser automation, Node.js (argument parsing, HTML templating, SRT generation), edge-tts TTS integration, video post-production engineering, Jest test engineering, technical writing for AI agent instructions, cross-platform compatibility testing (Linux/macOS/Windows), JSON schema design, git workflow (multi-file atomic commit).

**Aggregation Tags:**
demo-video, skill-creation, playwright, ffmpeg, tts, e2e-testing, opensassi, video-pipeline, agent-skill, jest, cross-platform, edge-tts
