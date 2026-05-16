import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { TTLCache } from './cache.js';
function normalizeDay(raw, date) {
    const a = raw;
    if (a && typeof a === 'object' && 'dashboard' in a && a.dashboard) {
        const ds = a.dashboard.daily_summary;
        return {
            date: ds.date,
            metadata: a.dashboard.metadata,
            total_prompter_time_hours: ds.total_prompter_time_hours,
            total_sme_time_hours: ds.total_sme_time_hours,
            ai_multiplier: ds.ai_multiplier,
            total_sessions: ds.total_sessions,
            top_subject_areas: ds.top_subject_areas,
            session_breakdown: a.dashboard.session_breakdown,
        };
    }
    const b = raw;
    if (b && typeof b === 'object' && 'date' in b && b.date) {
        return {
            date: b.date,
            total_prompter_time_hours: b.total_prompter_time_hours,
            total_sme_time_hours: b.total_sme_time_hours,
            ai_multiplier: b.ai_multiplier,
            total_sessions: b.total_sessions,
            top_subject_areas: b.top_subject_areas,
            session_breakdown: b.session_breakdown,
        };
    }
    return {
        date,
        total_prompter_time_hours: 0,
        total_sme_time_hours: 0,
        ai_multiplier: 0,
        total_sessions: 0,
        top_subject_areas: [],
        session_breakdown: [],
    };
}
export class SessionsService {
    dailyCache = new TTLCache(60_000);
    detailCache = new TTLCache(300_000);
    daysListCache = new TTLCache(30_000);
    sessionsDir;
    constructor(sessionsDir) {
        this.sessionsDir = resolve(sessionsDir);
    }
    get dailyDir() {
        return join(this.sessionsDir, 'daily');
    }
    listDays() {
        const cached = this.daysListCache.get('list');
        if (cached)
            return cached;
        const dir = this.dailyDir;
        if (!existsSync(dir))
            return [];
        const files = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, '')).sort();
        this.daysListCache.set('list', files);
        return files;
    }
    listSessionsDirFiles() {
        if (!existsSync(this.sessionsDir))
            return [];
        return readdirSync(this.sessionsDir).filter(f => f.endsWith('.json.bz2'));
    }
    getDay(date) {
        const cached = this.dailyCache.get(date);
        if (cached)
            return cached;
        const path = join(this.dailyDir, `${date}.json`);
        if (!existsSync(path)) {
            const day = {
                date,
                total_prompter_time_hours: 0,
                total_sme_time_hours: 0,
                ai_multiplier: 0,
                total_sessions: 0,
                top_subject_areas: [],
                session_breakdown: [],
            };
            this.dailyCache.set(date, day);
            return day;
        }
        const raw = JSON.parse(readFileSync(path, 'utf-8'));
        const day = normalizeDay(raw, date);
        this.dailyCache.set(date, day);
        return day;
    }
    getAllSessionsFlat() {
        const days = this.listDays();
        const result = [];
        for (const day of days) {
            const normalized = this.getDay(day);
            for (const entry of normalized.session_breakdown) {
                result.push({ date: day, entry });
            }
        }
        return result;
    }
    getSessionDetail(sessionId) {
        const cached = this.detailCache.get(sessionId);
        if (cached)
            return cached;
        const bz2File = this.resolveBz2File(sessionId);
        if (!bz2File)
            return null;
        try {
            const json = execFileSync('bzcat', [bz2File], { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });
            const detail = JSON.parse(json);
            this.detailCache.set(sessionId, detail);
            return detail;
        }
        catch {
            return null;
        }
    }
    getSessionSummary(sessionId) {
        const mdFile = this.resolveMdFile(sessionId);
        if (!mdFile)
            return null;
        return readFileSync(mdFile, 'utf-8');
    }
    resolveBz2File(sessionId) {
        const exact = join(this.sessionsDir, `${sessionId}.json.bz2`);
        if (existsSync(exact))
            return exact;
        const files = this.listSessionsDirFiles();
        const match = files.find(f => f.startsWith(sessionId) && f.endsWith('.json.bz2'));
        if (match)
            return join(this.sessionsDir, match);
        return null;
    }
    resolveMdFile(sessionId) {
        const exact = join(this.sessionsDir, `${sessionId}.md`);
        if (existsSync(exact))
            return exact;
        if (!existsSync(this.sessionsDir))
            return null;
        const files = readdirSync(this.sessionsDir).filter(f => f.endsWith('.md'));
        const match = files.find(f => f.startsWith(sessionId));
        if (match)
            return join(this.sessionsDir, match);
        return null;
    }
    search(query) {
        const q = query.toLowerCase();
        const results = [];
        const days = this.listDays();
        for (const day of days) {
            const normalized = this.getDay(day);
            for (const entry of normalized.session_breakdown) {
                if (entry.top_component_summary.toLowerCase().includes(q)) {
                    results.push({
                        session_id: entry.session_id,
                        date: day,
                        summary: entry.top_component_summary,
                        tags: entry.tags,
                        match_type: 'summary',
                        match_snippet: entry.top_component_summary,
                    });
                    continue;
                }
                const matchedTag = entry.tags.find(t => t.toLowerCase().includes(q));
                if (matchedTag) {
                    results.push({
                        session_id: entry.session_id,
                        date: day,
                        summary: entry.top_component_summary,
                        tags: entry.tags,
                        match_type: 'tag',
                        match_snippet: matchedTag,
                    });
                    continue;
                }
                const detail = this.getSessionDetail(entry.session_id);
                if (detail) {
                    for (const msg of detail.messages) {
                        for (const part of msg.parts) {
                            if (part.text && part.text.toLowerCase().includes(q)) {
                                const snippet = part.text.slice(Math.max(0, part.text.toLowerCase().indexOf(q) - 40), part.text.toLowerCase().indexOf(q) + 80);
                                results.push({
                                    session_id: entry.session_id,
                                    date: day,
                                    summary: entry.top_component_summary,
                                    tags: entry.tags,
                                    match_type: 'transcript',
                                    match_snippet: snippet,
                                });
                                break;
                            }
                        }
                        if (results.length > 0 && results[results.length - 1].session_id === entry.session_id && results[results.length - 1].match_type === 'transcript')
                            break;
                    }
                }
            }
        }
        return results;
    }
    refresh() {
        this.dailyCache.invalidateAll();
        this.daysListCache.invalidateAll();
        this.detailCache.invalidateAll();
    }
}
