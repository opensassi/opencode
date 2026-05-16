#!/usr/bin/env bash
set -euo pipefail

MISSING=0

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "[MISSING] $1 — $2"
    MISSING=1
  else
    echo "[OK]      $1 — $("$1" --version 2>&1 | head -1)"
  fi
}

check_npx() {
  if ! npx --yes playwright --version &>/dev/null; then
    echo "[MISSING] playwright — npx playwright install chromium"
    MISSING=1
  else
    echo "[OK]      playwright — $(npx playwright --version 2>&1)"
  fi
}

check_pip() {
  if ! python3 -m edge_tts --version &>/dev/null; then
    echo "[MISSING] edge-tts — pip install edge-tts"
    MISSING=1
  else
    echo "[OK]      edge-tts — $(python3 -m edge_tts --version 2>&1)"
  fi
}

echo "=== demo-video dependency check ==="
check_cmd ffmpeg "apt/brew/choco install ffmpeg"
check_npx
check_pip
echo ""
if [ "$MISSING" -eq 1 ]; then
  echo "Some dependencies are missing. Install them and re-run."
  exit 1
else
  echo "All dependencies satisfied."
  exit 0
fi
