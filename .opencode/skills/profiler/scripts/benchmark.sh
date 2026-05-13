#!/usr/bin/env bash
# Benchmark: run N iterations of your program with timing.
# Usage: ./benchmark.sh [--iter N]

source "$(dirname "$0")/common.sh"

# --- Parse args ---
ITERATIONS=$DEFAULT_ITERATIONS

while [[ $# -gt 0 ]]; do
    case "$1" in
        --iter)   shift; ITERATIONS="$1" ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

PROGRAM="$(find_program)"
if [[ -z "$PROGRAM" ]]; then
    log_error "Program binary not found."
    exit 1
fi

# --- Iteration loop ---
RESULTS_FILE="$OUTPUT_DIR/benchmarks/benchmark-$(timestamp).json"

declare -a ITER_DATA
for ((i=1; i<=ITERATIONS; i++)); do
    log_info "Iteration $i / $ITERATIONS ..."

    START_MS=$(date +%s%3N)
    "$PROGRAM" 2>&1 | tee "$OUTPUT_DIR/benchmarks/iter_${i}.log"
    END_MS=$(date +%s%3N)
    WALL_MS=$((END_MS - START_MS))

    ITEM=$(cat <<ITEMEOF
    {
      "iter": $i,
      "wall_time_ms": $WALL_MS
    }
ITEMEOF
)
    ITER_DATA+=("$ITEM")
done

# --- Build JSON ---
JSON=$(cat <<JSONEOF
{
  "label": "benchmark-$(timestamp)",
  "timestamp": "$(timestamp)",
  "iterations": [
    $(IFS=,; echo "${ITER_DATA[*]}")
  ],
  "config": {
    "program": "$PROGRAM",
    "iterations": $ITERATIONS
  }
}
JSONEOF
)

echo "$JSON" > "$RESULTS_FILE"
log_info "Benchmark saved: $RESULTS_FILE"
