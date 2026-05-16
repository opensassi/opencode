#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: capture-browser.sh --url <url> [--actions <json>] --duration <sec> --output <file>"
  exit 1
}

URL=""
ACTIONS="[]"
DURATION=""
OUTPUT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --actions) ACTIONS="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[ -z "$URL" ] || [ -z "$DURATION" ] || [ -z "$OUTPUT" ] && usage

mkdir -p "$(dirname "$OUTPUT")"

node -e "
const { chromium } = require('playwright');
const actions = ${ACTIONS};
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: '$(dirname "$OUTPUT")', size: { width: 1920, height: 1080 } }
  });
  const page = await context.newPage();
  const startMs = Date.now();
  await page.goto('${URL}', { waitUntil: 'networkidle' });

  if (actions.length > 0) {
    for (const action of actions) {
      const el = action.selector ? await page.\$(action.selector) : null;
      if (!el) continue;
      if (action.type === 'click') await el.click();
      else if (action.type === 'type' && action.text) await el.fill(action.text);
      else if (action.type === 'scroll') await page.evaluate((s) => window.scrollBy(0, s), action.y || 500);
      await page.waitForTimeout(500);
    }
  }

  const elapsed = (Date.now() - startMs) / 1000;
  const remaining = Math.max(0, ${DURATION} - elapsed);
  await page.waitForTimeout(remaining * 1000);
  await context.close();
  await browser.close();
  const videoPath = await page.video().path();
  require('fs').renameSync(videoPath, '${OUTPUT}');
  console.log('Captured: ${OUTPUT}');
})();
" || {
  echo "FAILED: Could not capture $URL"
  exit 1
}
