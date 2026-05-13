#!/usr/bin/env bash
# Compare two benchmark JSON files, output Δ% table with regression detection.
# Usage: ./compare.sh <baseline.json> <candidate.json>

source "$(dirname "$0")/common.sh"

if [[ $# -ne 2 ]]; then
    log_error "Usage: $0 <baseline.json> <candidate.json>"
    exit 1
fi

BASELINE="$1"
CANDIDATE="$2"

if [[ ! -f "$BASELINE" ]]; then log_error "Baseline not found: $BASELINE"; exit 1; fi
if [[ ! -f "$CANDIDATE" ]]; then log_error "Candidate not found: $CANDIDATE"; exit 1; fi

python3 -c "
import json, sys

with open('$BASELINE') as f: b = json.load(f)
with open('$CANDIDATE') as f: c = json.load(f)

def avg(items, key):
    vals = [i.get(key) for i in items if i.get(key) is not None]
    if not vals:
        return None
    return sum(vals) / len(vals)

def pct(b_val, c_val):
    if b_val is None or c_val is None or b_val == 0:
        return None
    return ((c_val - b_val) / b_val) * 100

b_t = avg(b['iterations'], 'wall_time_ms')
c_t = avg(c['iterations'], 'wall_time_ms')

print(f\"{'Metric':<25} {'Baseline':<14} {'Candidate':<14} {'Δ%':<10} {'Status'}\")
print(f\"{'-'*25} {'-'*14} {'-'*14} {'-'*10} {'-'*10}\")

def fmt(v, unit=''):
    if v is None: return 'N/A'
    return f'{v:.2f}{unit}'

regression = False

# Wall time: negative Δ% = good (faster)
dt = pct(b_t, c_t)
status = '✓' if dt is not None and dt < $THRESHOLD_TIME_PCT else ''
if dt is not None and dt >= $THRESHOLD_TIME_PCT:
    status = '⚠ REGRESSION'
    regression = True
print(f\"{'Wall time (ms)':<25} {fmt(b_t):<14} {fmt(c_t):<14} {fmt(dt, '%'):<10} {status}\")

print()
if regression:
    print('⚠  REGRESSION DETECTED: time exceeded threshold.')
else:
    print('✓  PASS: no regression detected.')
" 2>&1 || {
    log_error "Comparison failed. Ensure both files are valid benchmark JSON."
    exit 1
}
