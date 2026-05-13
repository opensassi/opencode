#!/usr/bin/env bash
# ensure-gitignore.sh — Add common .gitignore patterns if missing.
# Usage: bash ensure-gitignore.sh

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || cd "$(dirname "$0")/../../.." && pwd)"
GITIGNORE="$PROJECT_ROOT/.gitignore"

PATTERNS=(
    "# Build directories"
    "/build*/"
    "/bin/"
    "/lib/"
    "/install/"

    "# IDE"
    ".vscode/"
    ".idea/"
    "*.swp"
    "*.swo"

    "# Dependencies"
    "node_modules/"

    "# Generated artifacts"
    ".artifacts/"
    "src/**/.artifacts/"

    "# Browser automation"
    ".playwright-mcp/"

    "# Profiling and performance data"
    ".profiler/"

    "# Sessions"
    "sessions/"
    "!sessions/export-session.sh"
    "!sessions/.gitkeep"
    "!sessions/daily/.gitkeep"

    "# Performance experiments"
    "perf/experiments/"
    "perf/baseline/"

    "# Test data"
    "test/data/"

    "# CTest temporary files"
    "Testing/"

    "# External project clones"
    "/external/"

    "# OS files"
    ".DS_Store"
    "Thumbs.db"

    "# Core dumps"
    "core"
)

ensure_pattern() {
    local pattern="$1"
    # Skip comment lines
    if [[ "$pattern" == \#* ]]; then
        return 0
    fi
    # Escape special chars for grep -F
    if grep -qxF "$pattern" "$GITIGNORE" 2>/dev/null; then
        return 0
    fi
    echo "$pattern" >> "$GITIGNORE"
    echo "  [added] $pattern"
}

# Ensure file exists
touch "$GITIGNORE"

echo "[INFO] Ensuring .gitignore patterns..."
for p in "${PATTERNS[@]}"; do
    ensure_pattern "$p"
done
echo "[INFO] .gitignore is up to date"
