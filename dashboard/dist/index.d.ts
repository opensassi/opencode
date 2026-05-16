export interface DashboardOptions {
    port: number;
    sessionsDir: string;
    repoDir: string;
    experimentsDir?: string;
    host: string;
    gitSince?: string;
}
export declare function startDashboard(opts?: Partial<DashboardOptions>): void;
