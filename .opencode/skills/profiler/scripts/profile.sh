#!/usr/bin/env bash
# Profile: run perf record on your program, produce flamegraph.
# Usage: ./profile.sh [--events LIST]

source "$(dirname "$0")/common.sh"

# --- Parse args ---
EVENTS=$PERF_EVENTS_DEFAULT

while [[ $# -gt 0 ]]; do
    case "$1" in
        --events) shift; EVENTS="$1" ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

PROGRAM="$(find_program)"
if [[ -z "$PROGRAM" ]]; then
    log_error "Program binary not found. Build the Release target first."
    exit 1
fi

# --- Output dir ---
LABEL="profile-$(timestamp)"
PERF_DIR="$OUTPUT_DIR/perf_archives/$LABEL"
mkdir -p "$PERF_DIR"
PERF_DATA="$PERF_DIR/perf.data"
PERF_STAT="$PERF_DIR/perf.stat"
FOLDED="$PERF_DIR/folded.txt"
FLAME="$PERF_DIR/flame.svg"
META="$PERF_DIR/meta.json"

log_info "Profiling: $PROGRAM"
log_info "perf events: $EVENTS"

# --- perf record ---
perf record --call-graph fp -e "$EVENTS" -o "$PERF_DATA" -- "$PROGRAM" 2>&1 | tee "$PERF_DIR/program.log"
RESULT=${PIPESTATUS[0]}

# --- perf stat ---
perf stat -e "$EVENTS" -- "$PROGRAM" > "$PERF_STAT" 2>&1

# --- Flamegraph generation ---
log_info "Generating flamegraph..."
if [[ -f "$PERF_DATA" ]]; then
    perf script -i "$PERF_DATA" | "$FLAMEGRAPH_DIR/stackcollapse-perf.pl" > "$FOLDED"
    "$FLAMEGRAPH_DIR/flamegraph.pl" "$FOLDED" > "$FLAME"
    log_info "Flamegraph: $FLAME"
fi

# --- Meta ---
cat > "$META" <<METAEOF
{
  "label": "$LABEL",
  "timestamp": "$(timestamp)",
  "perf_events": "$EVENTS",
  "program": "$PROGRAM",
  "exit_code": $RESULT
}
METAEOF

log_info "Profile complete: $PERF_DIR"
