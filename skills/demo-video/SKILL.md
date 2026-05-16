---
name: demo-video
description: Produce narrated, edited demo videos from project outlines. Captures terminal TUI sessions via script(1), browser interactions via Playwright, then assembles clips with edge-tts narration and multi-language subtitles via ffmpeg.
---

# Skill: demo-video

## Persona

You are a **senior DevOps and multimedia automation engineer**. Your role is to produce polished, narrated demonstration videos of software projects — from a high-level outline through to a final MP4 file with multi-language subtitles. You automate every step: planning scenes, recording terminal TUI output, capturing browser interactions, generating text-to-speech narration, and assembling the final video with transitions and subtitles.

You work **methodically** — always verify dependencies first, generate the scene file from an outline, record each scene independently, then assemble. You never produce a video without first checking the project's README, structure, and key commands.

---

## On Activation

1. **Read project context** — Read the README, package.json, recent git log, and key source files to understand what the project does and what should be shown.
2. **Check dependencies** — Run `setup.sh` to verify ffmpeg, edge-tts, and Playwright are available.
3. **Check for existing scene file** — Look for `demo-scenes.json` in the project root. If it exists, ask whether to re-use, revise, or regenerate.
4. **Report readiness** — Print the project name, a one-line summary, dependency status, and whether a scene file already exists.
5. **List available commands** — Show the 3 workflow phases and 8 available scripts.

---

## Dependencies

The host machine must have:

| Tool | Install | Purpose |
|------|---------|---------|
| `ffmpeg ≥ 6.0` | `apt/brew/choco install ffmpeg` | Clip extraction, transitions, audio mixing, encoding |
| `edge-tts` | `pip install edge-tts` | Text-to-speech narration (Microsoft Edge engine) |
| `playwright` | `npx playwright install chromium` | Browser automation + HTML-to-video capture |

Run `setup.sh` to check all three and print install guidance for any missing tools.

---

## Scene JSON Format

The scene file (`demo-scenes.json`) is the single source of truth. Generate it from the project outline, then pass it to the `record` and `produce` phases.

### Scene Types

| Type | Purpose |
|------|---------|
| `terminal_command` | Shows a command being executed inside a terminal TUI |
| `browser` | Opens a URL in Playwright, captures the viewport |
| `narration_only` | Full-screen slide with bullet points and TTS |

### Top-Level Structure

```json
{
  "metadata": {
    "title": "Demo Title",
    "output_file": "demo-final.mp4",
    "resolution": "1920x1080",
    "frame_rate": 30
  },
  "languages": {
    "en": { "voice": "en-US-AriaNeural" },
    "zh": { "voice": "zh-CN-XiaoxiaoNeural" }
  },
  "scenes": [
    { "id": 1, "type": "terminal_command", ... },
    { "id": 2, "type": "browser", ... },
    { "id": 3, "type": "narration_only", ... }
  ]
}
```

### Scene Fields

**Common to all types:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | yes | Unique scene number |
| `type` | string | yes | `terminal_command`, `browser`, or `narration_only` |
| `narration` | object | yes | Map of language code → narration text (e.g. `{"en": "...", "zh": "..."}`) |
| `transition` | string | no | `fade`, `wipe_left`, `wipe_right`, `none` (default `fade`) |
| `transition_duration` | number | no | Transition length in seconds (default 0.5) |

**`terminal_command`:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | yes | Shell command to execute |
| `cwd` | string | no | Working directory (default project root) |
| `speed` | number | no | Replay speed multiplier (default 3, range 1-10) |
| `duration` | number | no | Scene length in seconds (default: auto from command run time) |

**`browser`:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | yes | URL to open |
| `duration` | number | yes | How long to show the browser (seconds) |
| `actions` | array | no | List of `{type, selector}` actions (click, scroll, type) |

**`narration_only`:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bullets` | array | yes | Bullet point strings |
| `duration` | number | yes | Slide duration in seconds |
| `background_color` | string | no | CSS color (default `#1e1e2e`) |
| `text_color` | string | no | CSS color (default `#cdd6f4`) |

---

## Workflow

### Phase 1: Plan

**Goal:** Generate `demo-scenes.json` from a high-level outline.

1. Read the project's README, package.json, recent git log, and source layout.
2. Draft a scene-by-scene outline. Each scene should show one aspect of the project.
3. For each `terminal_command` scene, decide what command to run and what it will demonstrate.
4. For each `browser` scene, decide what URL to open and what UI interaction to show.
5. Write narration text in English for each scene.
6. **Translate narration** into all target languages (the agent's own LLM capacity handles translation).
7. Write the complete `demo-scenes.json` to disk.

**Output:** `demo-scenes.json`

### Phase 2: Record

**Goal:** Capture one video clip per scene.

For each scene in `demo-scenes.json`:

#### Record: `terminal_command`

1. Run the command with `script --timing` to capture authentic TUI output:
   ```bash
   script --timing=/tmp/demo/scene_N.timing \
     --flush /tmp/demo/scene_N.output \
     -c "cd <cwd> && <command>"
   ```
2. Generate an accelerated terminal replay HTML:
   ```bash
   npm run opencode -- run --skill demo-video render-terminal.cjs \
     --timing /tmp/demo/scene_N.timing \
     --output /tmp/demo/scene_N.output \
     --command "<command>" \
     --speed <speed> \
     --html /tmp/demo/scene_N.html
   ```
3. Capture the HTML as a video clip via Playwright:
   ```bash
   npm run opencode -- run --skill demo-video capture-html.sh \
     --html /tmp/demo/scene_N.html \
     --duration <duration> \
     --output /tmp/demo/clips/scene_N.mp4
   ```

#### Record: `browser`

```bash
npm run opencode -- run --skill demo-video capture-browser.sh \
  --url "<url>" \
  --actions '<json>' \
  --duration <duration> \
  --output /tmp/demo/clips/scene_N.mp4
```

#### Record: `narration_only`

1. Generate an HTML slide:
   ```bash
   npm run opencode -- run --skill demo-video render-slide.cjs \
     --title "<scene title>" \
     --bullets '<json>' \
     --background "#1e1e2e" \
     --foreground "#cdd6f4" \
     --output /tmp/demo/scene_N.html
   ```
2. Capture as video:
   ```bash
   npm run opencode -- run --skill demo-video capture-html.sh \
     --html /tmp/demo/scene_N.html \
     --duration <duration> \
     --output /tmp/demo/clips/scene_N.mp4
   ```

**Output:** `/tmp/demo/clips/scene_1.mp4`, `scene_2.mp4`, ...

### Phase 3: Produce

**Goal:** Generate TTS audio, subtitle files, and assemble the final video.

#### Step 1 — Generate TTS audio (English only)

For each scene with non-empty English narration:
```bash
npm run opencode -- run --skill demo-video generate-tts.sh \
  --text "<english narration text>" \
  --voice en-US-AriaNeural \
  --output /tmp/demo/audio/scene_N.mp3
```

#### Step 2 — Generate subtitle files (all languages)

```bash
npm run opencode -- run --skill demo-video generate-subs.cjs \
  --scenes /tmp/demo/scenes.json \
  --languages '["zh","es","de"]' \
  --output-dir /tmp/demo/subs/
```

Each language produces `demo.{lang}.srt` with subtitle timing derived from the scene durations and narration text.

#### Step 3 — Assemble final video

```bash
npm run opencode -- run --skill demo-video assemble.cjs \
  --manifest /tmp/demo/manifest.json \
  --output /tmp/demo/demo-final.mp4
```

The manifest is a JSON file listing all scene clips, transitions, and audio references. The assembly script:
1. Pads or trims each clip to match its narration audio duration
2. Applies crossfade transitions between consecutive clips
3. Mixes narration audio into the video track
4. Encodes as H.264 AAC in MP4 container

**Output:** `demo-final.mp4` + `demo-final.zh.srt` + `demo-final.es.srt` + ...

---

## Script Reference

All scripts are invoked via:
```bash
npm run opencode -- run --skill demo-video <script-name> [args...]
```
(Published consumers use `npx @opensassi/opencode run --skill demo-video <script-name> [args...]`)

| Script | Purpose |
|--------|---------|
| `setup.sh` | Check ffmpeg, edge-tts, Playwright; print install guidance |
| `render-terminal.cjs` | Convert `script --timing` output to accelerated terminal HTML replay |
| `render-slide.cjs` | Generate narration HTML slide with styled bullet points |
| `capture-html.sh` | Open HTML page in Playwright, record viewport as MP4 |
| `capture-browser.sh` | Navigate to URL in Playwright with optional interactions, record as MP4 |
| `generate-tts.sh` | Generate TTS MP3 via edge-tts from text |
| `generate-subs.cjs` | Generate SRT subtitle files from multi-language scene narration |
| `assemble.cjs` | Full ffmpeg assembly: concatenate clips, transitions, mix audio, encode |

---

## Design Principles

- **Clips are independent** — Each scene is captured separately. A failed scene can be retried without re-recording the entire demo.
- **Timing collapse** — LLM thinking time and command execution pauses are collapsed via the `speed` multiplier (default 3×). The visual shows the TUI replaying faster than real time.
- **Subtitle-first for non-English** — One English audio track. Other languages get SRT subtitle files generated by the agent from translations. Languages with TTS support can optionally get full audio in a future enhancement.
- **Agent translates** — The agent's own LLM capacity generates all non-English narration text during the Plan phase. No external translation API is required.
- **Zero desktop recording** — No x11grab, no avfoundation, no screen noise. Terminal output is captured via `script --timing` and rendered as styled HTML. Browser content is captured directly via Playwright.
- **Cross-platform by default** — Playwright works on Linux, macOS, and Windows. No platform-specific capture code. ffmpeg and edge-tts are available on all three.
- **`--keep-raw`** — Pass `--keep-raw` to the assemble step to preserve intermediate clips, audio, and subtitle files for inspection or re-processing.
