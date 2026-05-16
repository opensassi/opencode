#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: generate-tts.sh --text <text> --voice <name> --output <file>"
  exit 1
}

TEXT=""
VOICE="en-US-AriaNeural"
OUTPUT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --text) TEXT="$2"; shift 2 ;;
    --voice) VOICE="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[ -z "$TEXT" ] || [ -z "$OUTPUT" ] && usage

mkdir -p "$(dirname "$OUTPUT")"

python3 -m edge_tts --voice "$VOICE" --text "$TEXT" --write-media "$OUTPUT"

echo "Generated: $OUTPUT"
