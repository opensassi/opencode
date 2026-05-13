#!/usr/bin/env bash
# install-flamegraph.sh — Clone Brendan Gregg's FlameGraph at pinned tag v1.0.
# Idempotent: updates existing clone if present.
# Usage: bash install-flamegraph.sh

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "$0")/../../.." && pwd))"
FLAMEGRAPH_DIR="$PROJECT_ROOT/scripts/FlameGraph"

if [ -d "$FLAMEGRAPH_DIR/.git" ]; then
    echo "[INFO] FlameGraph already cloned. Updating to v1.0..."
    git -C "$FLAMEGRAPH_DIR" fetch --tags --depth=1 2>&1 | tail -1
    git -C "$FLAMEGRAPH_DIR" checkout v1.0 2>&1 || {
        echo "[WARN] Could not checkout v1.0; resetting to tag..."
        git -C "$FLAMEGRAPH_DIR" reset --hard v1.0 2>&1
    }
else
    echo "[INFO] Cloning FlameGraph v1.0 to $FLAMEGRAPH_DIR..."
    git clone --depth=1 --branch v1.0 https://github.com/brendangregg/FlameGraph.git "$FLAMEGRAPH_DIR" 2>&1 || {
        echo "[ERROR] Failed to clone FlameGraph. Clone manually:"
        echo "  git clone --depth=1 --branch v1.0 https://github.com/brendangregg/FlameGraph.git $FLAMEGRAPH_DIR"
        exit 1
    }
fi

if [ -f "$FLAMEGRAPH_DIR/flamegraph.pl" ]; then
    echo "[INFO] FlameGraph ready: $FLAMEGRAPH_DIR"
else
    echo "[WARN] FlameGraph clone may be incomplete — flamegraph.pl not found."
    ls "$FLAMEGRAPH_DIR" | head -10
fi
