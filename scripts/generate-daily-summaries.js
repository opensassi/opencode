#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const SESSIONS_DIR = resolve(process.cwd(), 'sessions');

function parseMdField(content, label) {
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)(?:\\n\\n|\\n(?=\\*\\*)|$)`, 's');
  const m = content.match(re);
  return m ? m[1].trim() : null;
}

function parseDurationMinutes(content) {
  // Try **Duration:** HH<something>
  const durMatch = content.match(/\*\*Duration:\*\*\s*(\d+)\s*min/);
  if (durMatch) return parseInt(durMatch[1], 10);

  // Fallback: from .json.bz2 (handled below)
  return 0;
}

function parsePrompterMinutes(content) {
  const totalMatch = content.match(/\*\*Total:\*\*\s*([\d.]+)\s*hours?/);
  if (totalMatch) return Math.round(parseFloat(totalMatch[1]) * 60);
  // also try: prompter active ≈ X hours
  const activeMatch = content.match(/prompter active\s*[≈~]?\s*([\d.]+)\s*hours?/);
  if (activeMatch) return Math.round(parseFloat(activeMatch[1]) * 60);
  return 30;
}

function parseSmeHours(content) {
  const smeMatch = content.match(/\*\*Model-Equivalent SME Time Estimate:\*\*\s*(?:~|≈)?\s*([\d.]+)\s*hours?/);
  if (smeMatch) return Math.round(parseFloat(smeMatch[1]) * 60);
  return 60;
}

function parseTags(content) {
  const tagMatch = content.match(/\*\*Aggregation Tags:\*\*\s*(.+?)(?:\\n\\n|$)/s);
  if (tagMatch) {
    return tagMatch[1].split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

function parseSessionId(content) {
  return parseMdField(content, 'Session ID') || '';
}

function parseDescription(content) {
  return parseMdField(content, 'Top-Level Component') || '';
}

function parseConfidence(/*content*/) {
  return 'medium';
}

function extractDate(sessionId, filename) {
  if (sessionId) {
    const m = sessionId.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function getBz2Duration(sessionDir, sessionId) {
  if (!sessionId) return null;
  const files = readdirSync(sessionDir);
  const match = files.find(f => f.startsWith(sessionId) && f.endsWith('.json.bz2'));
  if (!match) return null;
  try {
    const buf = execFileSync('bzcat', [join(sessionDir, match)], {
      encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'],
    });
    const d = JSON.parse(buf);
    const info = d.info || {};
    const t = info.time || {};
    const created = t.created || 0;
    const updated = t.updated || 0;
    if (updated && created) return Math.round((updated - created) / 60000);
    return null;
  } catch { return null; }
}

async function main() {
  if (!existsSync(SESSIONS_DIR)) {
    console.error(`Sessions directory not found: ${SESSIONS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(SESSIONS_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md') && !f.endsWith('.spec.md') && f !== 'README.md' && f !== 'export-session.sh');

  // Group sessions by date
  const byDate = {};

  for (const mdFile of mdFiles) {
    const content = readFileSync(join(SESSIONS_DIR, mdFile), 'utf-8');
    const sessionId = parseSessionId(content);
    const date = extractDate(sessionId, mdFile);
    if (!date) { console.error(`Could not extract date from ${mdFile}`); continue; }

    const prompterMin = parsePrompterMinutes(content);
    const smeMin = parseSmeHours(content);
    const bz2Duration = getBz2Duration(SESSIONS_DIR, sessionId);
    const durationMin = bz2Duration || prompterMin || parseDurationMinutes(content);
    const tags = parseTags(content);
    const description = parseDescription(content);
    const confidence = parseConfidence(content);

    if (!byDate[date]) byDate[date] = [];
    byDate[date].push({
      session_id: sessionId || mdFile.replace(/\.md$/, ''),
      duration_minutes: durationMin,
      prompter_time_minutes: Math.min(prompterMin, durationMin || prompterMin),
      sme_time_minutes: smeMin,
      top_component_summary: description,
      tags,
      human_confidence: confidence,
    });
  }

  // Generate daily files
  const dailyDir = join(SESSIONS_DIR, 'daily');
  if (!existsSync(dailyDir)) {
    mkdirSync(dailyDir, { recursive: true });
  }

  for (const [date, sessions] of Object.entries(byDate).sort()) {
    let totalPrompter = 0, totalSme = 0;
    for (const s of sessions) {
      totalPrompter += s.prompter_time_minutes;
      totalSme += s.sme_time_minutes;
    }
    const totalPrompterHrs = Math.round((totalPrompter / 60) * 10) / 10;
    const totalSmeHrs = Math.round((totalSme / 60) * 10) / 10;

    // Compute per-tag aggregates
    const tagMap = {};
    for (const s of sessions) {
      const perTagSme = s.sme_time_minutes / (s.tags.length || 1);
      const perTagPrompter = s.prompter_time_minutes / (s.tags.length || 1);
      for (const tag of s.tags) {
        if (!tagMap[tag]) tagMap[tag] = { prompter: 0, sme: 0 };
        tagMap[tag].prompter += perTagPrompter;
        tagMap[tag].sme += perTagSme;
      }
    }
    const topSubjectAreas = Object.entries(tagMap)
      .map(([name, v]) => ({
        name,
        prompter_time_hours: Math.round((v.prompter / 60) * 100) / 100,
        sme_time_hours: Math.round((v.sme / 60) * 100) / 100,
        ai_multiplier: v.prompter > 0 ? Math.round((v.sme / v.prompter) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.sme_time_hours - a.sme_time_hours);

    const aiMultiplier = totalPrompterHrs > 0
      ? Math.round((totalSmeHrs / totalPrompterHrs) * 10) / 10
      : 0;

    const daily = {
      dashboard: {
        metadata: {
          generated_at: new Date().toISOString(),
          audited: false,
          audit_note: 'Auto-generated from session evaluation files',
        },
        daily_summary: {
          date,
          total_prompter_time_hours: totalPrompterHrs,
          total_sme_time_hours: totalSmeHrs,
          ai_multiplier: aiMultiplier,
          total_sessions: sessions.length,
          top_subject_areas: topSubjectAreas,
        },
        session_breakdown: sessions,
      },
    };

    const outPath = join(dailyDir, `${date}.json`);
    writeFileSync(outPath, JSON.stringify(daily, null, 2) + '\n');
    console.log(`Wrote ${outPath}  (${sessions.length} sessions, ${totalPrompterHrs}h prompter, ${totalSmeHrs}h SME)`);
  }

  console.log(`\nDone. Generated ${Object.keys(byDate).length} daily summaries.`);
}

main().catch(e => { console.error(e); process.exit(1); });
