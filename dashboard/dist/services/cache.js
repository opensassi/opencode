export class TTLCache {
    store = new Map();
    defaultTTL;
    constructor(defaultTTLMs = 60_000) {
        this.defaultTTL = defaultTTLMs;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    set(key, value, ttlMs) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
        });
    }
    invalidate(key) {
        this.store.delete(key);
    }
    invalidateAll() {
        this.store.clear();
    }
}
