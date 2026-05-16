#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "${1:-.}" && pwd)"

echo "["

# 1. Project root
echo "  {\"name\": \".\", \"path\": \"$ROOT\", \"type\": \"project-root\"}"

# 2. external/ subdirectories
sep=","
if [ -d "$ROOT/external" ]; then
  for dir in "$ROOT/external"/*/; do
    [ -d "$dir" ] || continue
    name="$(basename "$dir")"
    abspath="$(cd "$dir" && pwd)"
    echo "$sep"
    echo -n "  {\"name\": \"$name\", \"path\": \"$abspath\", \"type\": \"external\"}"
    sep=","
  done
fi

# 3. packages/ workspace subdirectories (common in monorepos)
if [ -d "$ROOT/packages" ]; then
  for dir in "$ROOT/packages"/*/; do
    [ -d "$dir" ] || continue
    name="$(basename "$dir")"
    abspath="$(cd "$dir" && pwd)"
    echo "$sep"
    echo -n "  {\"name\": \"$name\", \"path\": \"$abspath\", \"type\": \"workspace\"}"
    sep=","
  done
fi

# 4. src/ subdirectories (common in project dirs)
if [ -d "$ROOT/src" ]; then
  for dir in "$ROOT/src"/*/; do
    [ -d "$dir" ] || continue
    name="$(basename "$dir")"
    abspath="$(cd "$dir" && pwd)"
    echo "$sep"
    echo -n "  {\"name\": \"$name\", \"path\": \"$abspath\", \"type\": \"project\"}"
    sep=","
  done
fi

echo ""
echo "]"
