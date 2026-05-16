import type { GitLogEntry, GitStats } from '../types.js';
export declare class GitService {
    private repoDir;
    private defaultSince;
    constructor(repoDir: string, defaultSince?: string | null);
    detectForkPoint(): string | null;
    getRange(rangeBase: string | null): string | undefined;
    getLog(since?: string, until?: string, forkRange?: string | null): GitLogEntry[];
    private parseLogOutput;
    getStats(forkRange?: string | null): GitStats;
    getCommitDiff(hash: string): string;
}
