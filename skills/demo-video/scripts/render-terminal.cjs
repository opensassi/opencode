#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace(/^--/, '');
    args[key] = process.argv[i + 1];
  }
  if (!args.timing || !args.output || !args.html) {
    console.error('Usage: render-terminal.cjs --timing <file> --output <file> --command <cmd> --speed <N> --html <out.html>');
    process.exit(1);
  }
  return args;
}

function parseScriptTiming(timingPath) {
  const raw = fs.readFileSync(timingPath, 'utf-8');
  const lines = raw.trim().split('\n');
  const entries = [];
  let absTime = 0;
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const delay = parseFloat(parts[0]);
    const bytes = parseInt(parts[1], 10);
    absTime += delay;
    entries.push({ absTime, delay, bytes });
  }
  return entries;
}

function generateHtml(segments, command) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  body { margin:0; background:#1e1e1e; display:flex; min-height:100vh; box-sizing:border-box; padding:20px; }
  .terminal { background:#0d1117; color:#c9d1d9; font-family:"Cascadia Code","Fira Code","JetBrains Mono",monospace; font-size:14px; width:100%; height:100%; border-radius:8px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.5); display:flex; flex-direction:column; }
  .titlebar { background:#161b22; padding:8px 16px; font-size:12px; color:#8b949e; display:flex; align-items:center; gap:8px; border-bottom:1px solid #30363d; flex-shrink:0; }
  .titlebar .dot { width:12px; height:12px; border-radius:50%; display:inline-block; }
  .titlebar .dot.r { background:#ff5f56; }
  .titlebar .dot.y { background:#ffbd2e; }
  .titlebar .dot.g { background:#27c93f; }
  .titlebar .title { margin-left:8px; }
  .screen { flex:1; padding:16px; overflow-y:auto; }
  .screen pre { margin:0; white-space:pre-wrap; word-break:break-all; font-family:inherit; font-size:inherit; line-height:1.5; }
</style>
</head>
<body>
<div class="terminal">
  <div class="titlebar">
    <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
    <span class="title">bash</span>
  </div>
  <div class="screen">
    <pre id="output"><span id="cmd-line"></span></pre>
  </div>
</div>
<script>
(function() {
  const pre = document.getElementById('output');
  const cmdLine = document.getElementById('cmd-line');
  const command = ${JSON.stringify(command)};
  const segs = ${JSON.stringify(segments)};
  let ci = 0;
  let si = 0;
  let buf = '';

  function next() {
    if (ci < command.length) {
      buf += command[ci];
      cmdLine.textContent = buf;
      ci++;
      setTimeout(next, 20 + Math.random() * 40);
    } else {
      if (si === 0) { buf += '\\n'; si++; setTimeout(next, 200); return; }
      if (si <= segs.length) {
        buf += segs[si - 1];
        cmdLine.textContent = '';
        pre.textContent = buf;
        si++;
        setTimeout(next, 150);
      }
    }
  }
  setTimeout(next, 200);
})();
</script>
</body>
</html>`;
}

function main() {
  const args = parseArgs();
  const timingPath = path.resolve(args.timing);
  const outputPath = path.resolve(args.output);
  const htmlPath = path.resolve(args.html);
  const command = args.command || '';
  const speed = parseFloat(args.speed) || 3;

  if (!fs.existsSync(timingPath)) {
    console.error('Timing file not found:', timingPath);
    process.exit(1);
  }
  if (!fs.existsSync(outputPath)) {
    console.error('Output file not found:', outputPath);
    process.exit(1);
  }

  const outputContent = fs.readFileSync(outputPath, 'utf-8');
  const timing = parseScriptTiming(timingPath);

  // Find the "Script started on ..." banner length so we can skip those bytes
  const bannerMatch = outputContent.match(/^Script started on[^\n]*\n/);
  const bannerLen = bannerMatch ? bannerMatch[0].length : 0;

  // Build content chunks, skipping bytes that belong to the banner
  const chunks = [];
  let byteOffset = 0;
  for (const entry of timing) {
    const start = byteOffset;
    const end = byteOffset + entry.bytes;
    byteOffset = end;
    if (end <= bannerLen) continue;
    const chunk = outputContent.slice(Math.max(start, bannerLen), end);
    chunks.push(chunk);
  }

  const html = generateHtml(chunks, command);
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`Wrote ${htmlPath}`);
}

main();
