#!/usr/bin/env bash
# install-npm-deps.sh — Install npm dependencies for the opencode project.
# Usage: bash install-npm-deps.sh

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "$0")/../../.." && pwd))"

if ! command -v node &>/dev/null; then
    echo "[ERROR] Node.js not found. Run env-check.sh first."
    exit 1
fi

if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo "[WARN] No package.json found at $PROJECT_ROOT — skipping npm install"
    exit 0
fi

echo "[INFO] Installing npm dependencies..."
cd "$PROJECT_ROOT"
npm install 2>&1 | tail -5 || {
    echo "[ERROR] npm install failed"
    exit 1
}
echo "[INFO] npm dependencies installed"
