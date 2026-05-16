#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: capture-html.sh --html <file> --duration <sec> --output <file>"
  exit 1
}

HTML=""
DURATION=""
OUTPUT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --html) HTML="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[ -z "$HTML" ] || [ -z "$DURATION" ] || [ -z "$OUTPUT" ] && usage
[ ! -f "$HTML" ] && echo "HTML file not found: $HTML" && exit 1

mkdir -p "$(dirname "$OUTPUT")"

node -e "
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: { dir: '$(dirname "$OUTPUT")', size: { width: 1920, height: 1080 } }
  });
  const page = await context.newPage();
  await page.goto('file://${HTML}');
  await page.waitForTimeout(${DURATION} * 1000);
  await context.close();
  await browser.close();
  const videoPath = await page.video().path();
  const outPath = path.resolve('${OUTPUT}');
  fs.renameSync(videoPath, outPath);
  console.log('Captured: ' + outPath);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
"
