#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace(/^--/, '');
    args[key] = process.argv[i + 1];
  }
  if (!args.title || !args.bullets || !args.output) {
    console.error('Usage: render-slide.js --title <text> --bullets <json> [--background <color>] [--foreground <color>] --output <file>');
    process.exit(1);
  }
  return args;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function generateHtml(title, bullets, bg, fg) {
  const bulletHtml = bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${bg}; color:${fg}; font-family:"Inter","Segoe UI",system-ui,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .slide { max-width:900px; padding:64px; text-align:center; }
  h1 { font-size:48px; font-weight:700; margin-bottom:48px; line-height:1.3; }
  ul { list-style:none; text-align:left; display:inline-block; }
  li { font-size:28px; line-height:1.8; margin:12px 0; padding-left:32px; position:relative; }
  li::before { content:"▸"; position:absolute; left:0; color:#58a6ff; }
</style>
</head>
<body>
<div class="slide">
  <h1>${escapeHtml(title)}</h1>
  <ul>${bulletHtml}</ul>
</div>
</body>
</html>`;
}

function main() {
  const args = parseArgs();
  const title = args.title;
  const bullets = JSON.parse(args.bullets);
  const bg = args.background || '#1e1e2e';
  const fg = args.foreground || '#cdd6f4';
  const outputPath = path.resolve(args.output);

  const html = generateHtml(title, bullets, bg, fg);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`Wrote ${outputPath}`);
}

main();
