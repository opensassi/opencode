#!/usr/bin/env bash
# Setup: prepare profiler directories, download test data, clone FlameGraph.
# Usage: ./setup.sh

source "$(dirname "$0")/common.sh"

# --- Ensure output dirs ---
mkdir -p "$OUTPUT_DIR"/{flamegraphs,benchmarks,perf_archives,reports}

# --- Ensure .gitignore entries ---
GITIGNORE="$PROJECT_ROOT/.gitignore"
for pattern in "test/data/" ".profiler/"; do
    if ! grep -qxF "$pattern" "$GITIGNORE" 2>/dev/null; then
        echo "$pattern" >> "$GITIGNORE"
        log_info "Added '$pattern' to .gitignore"
    fi
done

# --- FlameGraph scripts ---
if [[ ! -f "$FLAMEGRAPH_DIR/stackcollapse-perf.pl" ]]; then
    log_info "FlameGraph scripts not found. Cloning..."
    git clone --depth=1 https://github.com/brendangregg/FlameGraph.git "$FLAMEGRAPH_DIR" || {
        log_error "Failed to clone FlameGraph. Clone manually:"
        log_error "  git clone --depth=1 https://github.com/brendangregg/FlameGraph.git $FLAMEGRAPH_DIR"
        exit 1
    }
    log_info "FlameGraph scripts installed at $FLAMEGRAPH_DIR"
else
    log_info "FlameGraph scripts already present"
fi

log_info "Setup complete. Place test data in $DATA_DIR/"
