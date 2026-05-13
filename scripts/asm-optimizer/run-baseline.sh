#!/usr/bin/env bash
set -euo pipefail

# run-baseline.sh
# Build a tagged release baseline and run the profiling matrix.
#
# USAGE: Customize the variables below for your project, then run:
#   ./scripts/asm-optimizer/run-baseline.sh [--rebuild]
#
#   --rebuild  Force rebuild even if baseline binaries exist

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BASELINE_DIR="$REPO_ROOT/perf/baseline"

# === CUSTOMIZE THESE FOR YOUR PROJECT ===
PROJECT_NAME="my-project"
TAG="v1.0.0"
BASELINE_SRC="$BASELINE_DIR/$PROJECT_NAME-$TAG"
BASELINE_BUILD="$BASELINE_DIR/build"
BASELINE_BIN="$BASELINE_SRC/build"
PROFILES_DIR="$BASELINE_DIR/profiles/default"
REPORTS_DIR="$BASELINE_DIR/reports"
TEST_INPUT="$REPO_ROOT/test/data/input.yuv"
PROGRAM_ARGS=("--input" "$TEST_INPUT" "--frames" "50")
# =========================================

# Output tree:
#   perf/baseline/
#   ├── <project>-<tag>/       ← git worktree checkout
#   ├── build/                  ← Release cmake build
#   ├── profiles/default/
#   │   ├── fast-5fr/
#   │   ├── fast-50fr/
#   │   ├── slow-5fr/
#   │   └── slow-50fr/
#   └── reports/
#       └── profile-summary.json

# Perf counter groups
PERF_COMPREHENSIVE="-d -d -d"
PERF_SIMD="-e fp_arith_inst_retired.256b_packed_single,fp_arith_inst_retired.128b_packed_single,fp_arith_inst_retired.scalar_single"
PERF_MEM_UOP="-e mem_load_uops_retired.l1_hit,mem_load_uops_retired.l1_miss,mem_load_uops_retired.l2_hit,mem_load_uops_retired.l2_miss,mem_load_uops_retired.l3_hit,mem_load_uops_retired_misc.l3_miss"

run_perf_pass() {
    local label="$1"
    local config="$2"
    local frames="$3"
    local events="$4"
    local suffix="$5"

    local outdir="$PROFILES_DIR/$label"
    mkdir -p "$outdir"
    local output="$outdir/perf-${suffix}.txt"

    echo "  [perf:$suffix] $config ${frames}fr ..."
    perf stat $events -o "$output" \
        "$BASELINE_BIN/$PROJECT_NAME" \
        "${PROGRAM_ARGS[@]}" \
        --config "$config" \
        --frames "$frames" \
        2>/dev/null || true

    if [ -f "$output" ]; then
        sed -i "1i# RUN: config=$config frames=$frames date=$(date -Iseconds)" "$output"
    fi
}

run_timing_pass() {
    local label="$1"
    local config="$2"
    local frames="$3"

    local outdir="$PROFILES_DIR/$label"
    mkdir -p "$outdir"
    local output="$outdir/timing.txt"

    echo "  [timing] $config ${frames}fr ..."
    for i in 1 2 3; do
        /usr/bin/time -f "real %e user %U sys %S" -a -o "$output" \
            "$BASELINE_BIN/$PROJECT_NAME" \
            "${PROGRAM_ARGS[@]}" \
            --config "$config" \
            --frames "$frames" \
            2>/dev/null
    done

    sed -i "1i# RUN: config=$config frames=$frames date=$(date -Iseconds)" "$output"
}

# ----------------------------------------------------------------

step() { echo ""; echo "==> $1"; }

step "1. Create baseline directory structure"
mkdir -p "$BASELINE_DIR" "$PROFILES_DIR" "$REPORTS_DIR"

step "2. Checkout $TAG via git worktree"
if [ ! -d "$BASELINE_SRC" ] || [ ! -f "$BASELINE_SRC/CMakeLists.txt" ]; then
    git -C "$REPO_ROOT" worktree add -f "$BASELINE_SRC" "$TAG"
    echo "  checked out $TAG at $BASELINE_SRC"
else
    echo "  source already exists"
fi

step "3. Build Release binary"
if [ ! -f "$BASELINE_BIN/$PROJECT_NAME" ] || [ "${1:-}" == "--rebuild" ]; then
    cmake -S "$BASELINE_SRC" -B "$BASELINE_BUILD" \
        -DCMAKE_BUILD_TYPE=Release
    cmake --build "$BASELINE_BUILD" -j "$(nproc)"
    echo "  build complete: $BASELINE_BIN/$PROJECT_NAME"
else
    echo "  binary already exists"
fi

# Verify binary
"$BASELINE_BIN/$PROJECT_NAME" --version 2>/dev/null || echo "  (no --version flag)"

step "4. Run profiling matrix"
CONFIGS=("fast" "slow")
FRAME_COUNTS=(5 50)

for config in "${CONFIGS[@]}"; do
    for frames in "${FRAME_COUNTS[@]}"; do
        label="${config}-${frames}fr"
        echo "--- Profiling $label ---"

        run_perf_pass "$label" "$config" "$frames" "$PERF_COMPREHENSIVE" "comprehensive"
        run_perf_pass "$label" "$config" "$frames" "$PERF_SIMD"          "simd"
        run_perf_pass "$label" "$config" "$frames" "$PERF_MEM_UOP"       "mem-uop"
        run_timing_pass  "$label" "$config" "$frames"
    done
done

step "5. Generate summary report"
cat > "$REPORTS_DIR/profile-summary.json" << REPORT_EOF
{
  "baseline": "$TAG",
  "date": "REPLACE_DATE",
  "configs": ["fast", "slow"],
  "frames": [5, 50],
  "counter_groups": [
    "comprehensive", "simd", "mem-uop"
  ]
}
REPORT_EOF

sed -i "s/REPLACE_DATE/$(date -Iseconds)/" "$REPORTS_DIR/profile-summary.json"

echo ""
echo "=========================================="
echo "Baseline setup complete!"
echo "  Source: $BASELINE_SRC"
echo "  Build:  $BASELINE_BUILD"
echo "  Binary: $BASELINE_BIN/$PROJECT_NAME"
echo "  Profiles: $PROFILES_DIR/"
echo "  Report:  $REPORTS_DIR/profile-summary.json"
echo "=========================================="
