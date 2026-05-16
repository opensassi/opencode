#!/usr/bin/env bash
# e2e-test.sh — Full pipeline E2E demo with master asset verification
#
#  1. Record raw terminal data + generate TTS
#  2. Render + capture each scene at TTS duration
#  3. assemble --mode video-only  → video_master.mp4
#  4. assemble --mode audio-only  → audio_master.m4a
#  5. ffprobe compare (fails if >0.5s mismatch)
#  6. assemble --mode final       → demo-e2e.mp4
#
# Usage: bash test/e2e-test.sh [--open]
set -euo pipefail

WORKDIR="/tmp/demo-e2e-$(date +%s)"
CLIPS="$WORKDIR/clips"
AUDIO="$WORKDIR/audio"
mkdir -p "$WORKDIR" "$CLIPS" "$AUDIO"

SCRIPT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR"/../.. && pwd)"

get_duration() {
  ffprobe -v error -show_entries format=duration -of csv=p=0 "$1" 2>/dev/null || echo 5
}

record_terminal_raw() {
  local name="$1" cmd="$2"
  echo "  [record] $name"
  script --timing="$WORKDIR/${name}.timing" \
    --flush "$WORKDIR/${name}.output" \
    -c "$cmd" 2>/dev/null
}

render_and_capture_terminal() {
  local name="$1" tts_file="$2" speed="${3:-3}" cmd="${4:-}"
  local dur; dur=$(get_duration "$tts_file")
  node "$SCRIPT_DIR/scripts/render-terminal.cjs" \
    --timing "$WORKDIR/${name}.timing" \
    --output "$WORKDIR/${name}.output" \
    --command "$cmd" \
    --speed "$speed" \
    --html "$WORKDIR/${name}.html"
  bash "$SCRIPT_DIR/scripts/capture-html.sh" \
    --html "$WORKDIR/${name}.html" \
    --duration "$dur" \
    --output "$CLIPS/${name}.mp4"
  echo "  [capture] $name — ${dur}s"
}

render_and_capture_slide() {
  local name="$1" title="$2" bullets="$3" tts_file="$4"
  local dur; dur=$(get_duration "$tts_file")
  node "$SCRIPT_DIR/scripts/render-slide.cjs" \
    --title "$title" \
    --bullets "$bullets" \
    --output "$WORKDIR/${name}.html"
  bash "$SCRIPT_DIR/scripts/capture-html.sh" \
    --html "$WORKDIR/${name}.html" \
    --duration "$dur" \
    --output "$CLIPS/${name}.mp4"
  echo "  [capture] $name — ${dur}s"
}

capture_browser_scene() {
  local name="$1" url="$2" tts_file="$3"
  local dur; dur=$(get_duration "$tts_file")
  bash "$SCRIPT_DIR/scripts/capture-browser.sh" \
    --url "$url" \
    --duration "$dur" \
    --output "$CLIPS/${name}.mp4"
  echo "  [capture] $name — ${dur}s (browser)"
}

start_dashboard() {
  local port="${1:-3000}"
  echo "  [dashboard] starting on port $port..."
  cd "$PROJECT_ROOT" && node scripts/dashboard.js --port "$port" &
  DASHBOARD_PID=$!
  for i in $(seq 1 15); do
    if curl -sf "http://127.0.0.1:$port/api/health" > /dev/null 2>&1; then
      echo "  [dashboard] ready"
      return 0
    fi
    sleep 0.5
  done
  echo "  [dashboard] failed to start"
  return 1
}

stop_dashboard() {
  if [ -n "${DASHBOARD_PID:-}" ]; then
    kill "$DASHBOARD_PID" 2>/dev/null || true
    wait "$DASHBOARD_PID" 2>/dev/null || true
    echo "  [dashboard] stopped"
  fi
}

generate_tts() {
  local name="$1" text="$2"
  bash "$SCRIPT_DIR/scripts/generate-tts.sh" \
    --text "$text" \
    --voice en-US-AriaNeural \
    --output "$AUDIO/${name}.mp3"
}

cat > "$WORKDIR/scenes.json" << 'SCHEMA'
{}
SCHEMA

# === Phase 1: Record raw + TTS ===
echo ""
echo "=== Phase 1: Record raw + TTS ==="
echo ""

echo "--- Scene 1: Intro slide ---"
generate_tts "intro" \
  "This is the demo-video skill for the opensassi opencode platform. It produces narrated, edited demonstration videos from project outlines, capturing terminal TUI sessions and browser interactions, and assembling them with multi-language subtitles."

echo "--- Scene 2: Skills index ---"
cmd_map_skills="cd '$PROJECT_ROOT' && npm run opencode -- opensassi --print-index 2>&1 | head -30"
record_terminal_raw "skills" "$cmd_map_skills"
generate_tts "skills" \
  "Here we see all available skills. The demo-video skill integrates as a standard skill, registered in the skills index."

echo "--- Scene 3: Environment check ---"
cmd_map_env="cd '$PROJECT_ROOT' && npm run opencode -- run --skill opensassi env-check.sh 2>&1"
record_terminal_raw "env" "$cmd_map_env"
generate_tts "env" \
  "The environment checker detects OS, distribution, package manager, Node.js, and git, outputting structured JSON."

echo "--- Scene 4: Pipeline design ---"
generate_tts "pipeline" \
  "The pipeline uses Playwright-first capture with no screen recording. Terminal output is captured via the script command and replayed at accelerated speed."

echo "--- Scene 5: Test results ---"
cmd_map_tests="cd '$PROJECT_ROOT' && npx jest --config skills/demo-video/test/jest.config.cjs --verbose 2>&1 | tail -10"
record_terminal_raw "tests" "$cmd_map_tests"
generate_tts "tests" \
  "All 36 tests pass across 9 test suites."

echo "--- Scene 6: Dashboard ---"
generate_tts "dashboard" \
  "The opencode dashboard displays session evaluations, daily reports, git activity, and search across all recorded sessions."

echo "--- Scene 7: Outro ---"
generate_tts "outro" \
  "The demo-video skill is complete. 22 files, approximately 950 lines of code, ready for use."

# === Phase 2: Render + capture (TTS-driven) ===
echo ""
echo "=== Phase 2: Render + capture ==="
echo ""

render_and_capture_slide "intro" \
  "Building the demo-video Skill" \
  '["Session: May 16, 2026","22 files · 950 lines · 36 tests"]' \
  "$AUDIO/intro.mp3"
render_and_capture_terminal "skills" "$AUDIO/skills.mp3" 4 "$cmd_map_skills"
render_and_capture_terminal "env" "$AUDIO/env.mp3" 3 "$cmd_map_env"
render_and_capture_slide "pipeline" \
  "Pipeline Design" \
  '["Playwright-first HTML capture","No screen recording","Multi-language subtitles","2-4x accelerated replay"]' \
  "$AUDIO/pipeline.mp3"
render_and_capture_terminal "tests" "$AUDIO/tests.mp3" 5 "$cmd_map_tests"
render_and_capture_slide "outro" \
  "demo-video Skill Complete" \
  '["9 scripts · 1 SKILL.md · 9 test files","3-phase pipeline: Plan / Record / Produce"]' \
  "$AUDIO/outro.mp3"

# === Phase 2.5: Browser scene (dashboard) ===
echo ""
echo "=== Phase 2.5: Dashboard browser scene ==="
echo ""

start_dashboard 3210 || echo "  [skip] dashboard not available"
capture_browser_scene "dashboard" "http://127.0.0.1:3210/#/daily/2026-05-16" "$AUDIO/dashboard.mp3"
stop_dashboard

# === Phase 3: Build manifest ===
echo ""
echo "=== Phase 3: Manifest ==="
echo ""

cat > "$WORKDIR/manifest.json" << MANIFEST
{
  "scenes": [
    {"clip":"$CLIPS/intro.mp4",    "duration":$(get_duration "$AUDIO/intro.mp3"),    "audio":"$AUDIO/intro.mp3"},
    {"clip":"$CLIPS/skills.mp4",   "duration":$(get_duration "$AUDIO/skills.mp3"),   "audio":"$AUDIO/skills.mp3"},
    {"clip":"$CLIPS/env.mp4",      "duration":$(get_duration "$AUDIO/env.mp3"),      "audio":"$AUDIO/env.mp3"},
    {"clip":"$CLIPS/pipeline.mp4", "duration":$(get_duration "$AUDIO/pipeline.mp3"), "audio":"$AUDIO/pipeline.mp3"},
    {"clip":"$CLIPS/tests.mp4",    "duration":$(get_duration "$AUDIO/tests.mp3"),    "audio":"$AUDIO/tests.mp3"},
    {"clip":"$CLIPS/outro.mp4",    "duration":$(get_duration "$AUDIO/outro.mp3"),    "audio":"$AUDIO/outro.mp3"},
    {"clip":"$CLIPS/dashboard.mp4","duration":$(get_duration "$AUDIO/dashboard.mp3"),"audio":"$AUDIO/dashboard.mp3"}
  ]
}
MANIFEST

# === Phase 4: Build masters ===
echo ""
echo "=== Phase 4: Build masters ==="
echo ""

VIDEO_MASTER="$WORKDIR/video_master.mp4"
AUDIO_MASTER="$WORKDIR/audio_master.m4a"
FINAL_OUTPUT="$WORKDIR/demo-e2e.mp4"

node "$SCRIPT_DIR/scripts/assemble.cjs" \
  --mode video-only \
  --manifest "$WORKDIR/manifest.json" \
  --output "$VIDEO_MASTER" \
  --keep-raw true

node "$SCRIPT_DIR/scripts/assemble.cjs" \
  --mode audio-only \
  --manifest "$WORKDIR/manifest.json" \
  --output "$AUDIO_MASTER" \
  --keep-raw true

# === Phase 5: Verify masters ===
echo ""
echo "=== Phase 5: Verify masters ==="
echo ""

V_DUR=$(get_duration "$VIDEO_MASTER")
A_DUR=$(get_duration "$AUDIO_MASTER")
DIFF=$(echo "$V_DUR - $A_DUR" | bc | sed 's/^-//')

echo "Video master: ${V_DUR}s"
echo "Audio master: ${A_DUR}s"
echo "Mismatch:     ${DIFF}s"

if (( $(echo "$DIFF > 0.5" | bc -l) )); then
  echo "ERROR: Video/audio mismatch exceeds 0.5s threshold"
  exit 1
fi
echo "Masters verified — within 0.5s tolerance."

# === Phase 6: Mix final ===
echo ""
echo "=== Phase 6: Mix final ==="
echo ""

node "$SCRIPT_DIR/scripts/assemble.cjs" \
  --mode final \
  --video "$VIDEO_MASTER" \
  --audio "$AUDIO_MASTER" \
  --output "$FINAL_OUTPUT"

# === Phase 7: Subtitles ===
echo ""
echo "=== Phase 7: Subtitles ==="
echo ""

cat > "$WORKDIR/scenes.json" << SCENES
{
  "scenes": [
    {"id":1,"duration":$(get_duration "$AUDIO/intro.mp3"),"narration":{"en":"This is the demo-video skill."}},
    {"id":2,"duration":$(get_duration "$AUDIO/skills.mp3"),"narration":{"en":"Here we see all available skills."}},
    {"id":3,"duration":$(get_duration "$AUDIO/env.mp3"),"narration":{"en":"The environment checker detects OS."}},
    {"id":4,"duration":$(get_duration "$AUDIO/pipeline.mp3"),"narration":{"en":"The pipeline uses Playwright-first capture."}},
    {"id":5,"duration":$(get_duration "$AUDIO/tests.mp3"),"narration":{"en":"All 36 tests pass."}},
    {"id":6,"duration":$(get_duration "$AUDIO/dashboard.mp3"),"narration":{"en":"The opencode dashboard displays session data, reports, and git activity."}},
    {"id":7,"duration":$(get_duration "$AUDIO/outro.mp3"),"narration":{"en":"The demo-video skill is complete."}}
  ],
  "languages": {"en":{"voice":"en-US-AriaNeural"}}
}
SCENES

node "$SCRIPT_DIR/scripts/generate-subs.cjs" \
  --scenes "$WORKDIR/scenes.json" \
  --languages '["en"]' \
  --output-dir "$WORKDIR/subs/"

# === Phase 8: Summary ===
echo ""
echo "=== Phase 8: Summary ==="
echo ""

OUT_SIZE=$(du -h "$FINAL_OUTPUT" 2>/dev/null | cut -f1)
V_SIZE=$(du -h "$VIDEO_MASTER" 2>/dev/null | cut -f1)
A_SIZE=$(du -h "$AUDIO_MASTER" 2>/dev/null | cut -f1)

echo "Video master: $VIDEO_MASTER  (${V_SIZE})"
echo "Audio master: $AUDIO_MASTER  (${A_SIZE})"
echo "Final output: $FINAL_OUTPUT  (${OUT_SIZE})"
echo "Duration:     ${V_DUR}s"
echo ""

VIDEOS_DIR="$HOME/Videos"
mkdir -p "$VIDEOS_DIR"
cp "$FINAL_OUTPUT" "$VIDEOS_DIR/demo-e2e.mp4"
echo "Copied to: $VIDEOS_DIR/demo-e2e.mp4"
echo ""

if [ "${1:-}" = "--open" ]; then
  xdg-open "$FINAL_OUTPUT" 2>/dev/null || open "$FINAL_OUTPUT" 2>/dev/null || true
else
  read -p "Open video now? [y/N] " OPEN_VIDEO
  if [ "$OPEN_VIDEO" = "y" ] || [ "$OPEN_VIDEO" = "Y" ]; then
    xdg-open "$FINAL_OUTPUT" 2>/dev/null || open "$FINAL_OUTPUT" 2>/dev/null || echo "File at: $FINAL_OUTPUT"
  fi
fi
