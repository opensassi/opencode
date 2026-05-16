export interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}
export declare class TTLCache<T> {
    private store;
    private defaultTTL;
    constructor(defaultTTLMs?: number);
    get(key: string): T | undefined;
    set(key: string, value: T, ttlMs?: number): void;
    invalidate(key: string): void;
    invalidateAll(): void;
}
