#!/usr/bin/env bash
# Common configuration and paths for the profiler skill.
# Source this from other scripts: source "$(dirname "$0")/common.sh"

set -euo pipefail

# --- Paths ---
PROJECT_ROOT="$(cd "$(dirname "$0")/../../../../" && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/.opencode/skills/profiler/scripts"
OUTPUT_DIR="$PROJECT_ROOT/.profiler"
DATA_DIR="$PROJECT_ROOT/test/data"
FLAMEGRAPH_DIR="$PROJECT_ROOT/scripts/FlameGraph"

# --- Default workload (customize for your project) ---
DEFAULT_INPUT="input"
DEFAULT_RESOLUTION="1280x720"
DEFAULT_FRAMES=10
DEFAULT_CONFIG="default"

# --- Benchmark defaults ---
DEFAULT_ITERATIONS=5

# --- Regression thresholds ---
THRESHOLD_TIME_PCT=2.0
THRESHOLD_QUALITY=0.1

# --- perf defaults ---
PERF_EVENTS_DEFAULT="cycles,cache-misses,branch-misses"

# --- Binary discovery (customize for your project) ---
find_program() {
    local paths=(
        "$PROJECT_ROOT/bin/release/program"
        "$PROJECT_ROOT/build/program"
        "$PROJECT_ROOT/program"
    )
    for p in "${paths[@]}"; do
        if [[ -x "$p" ]]; then
            echo "$p"
            return 0
        fi
    done
    echo ""
    return 1
}

# --- Timestamp ---
timestamp() {
    date +%Y%m%dT%H%M%S
}

# --- Logging ---
log_info()  { echo "[INFO]  $*"; }
log_warn()  { echo "[WARN]  $*" >&2; }
log_error() { echo "[ERROR] $*" >&2; }
