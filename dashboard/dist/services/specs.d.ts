import type { SpecNode } from '../types.js';
export declare class TechSpecService {
    private rootDir;
    constructor(rootDir: string);
    getTree(): SpecNode;
    readSpec(specPath: string): string | null;
    private scanDir;
    private hasSpecs;
}
