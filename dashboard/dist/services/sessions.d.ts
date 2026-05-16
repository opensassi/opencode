import type { NormalizedDay, SessionDetail, SessionEntry, SearchResult } from '../types.js';
export interface SessionsConfig {
    sessionsDir: string;
}
export declare class SessionsService {
    private dailyCache;
    private detailCache;
    private daysListCache;
    private sessionsDir;
    constructor(sessionsDir: string);
    get dailyDir(): string;
    listDays(): string[];
    listSessionsDirFiles(): string[];
    getDay(date: string): NormalizedDay;
    getAllSessionsFlat(): Array<{
        date: string;
        entry: SessionEntry;
    }>;
    getSessionDetail(sessionId: string): SessionDetail | null;
    getSessionSummary(sessionId: string): string | null;
    private resolveBz2File;
    private resolveMdFile;
    search(query: string): SearchResult[];
    refresh(): void;
}
