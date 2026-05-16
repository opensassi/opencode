import type { ExperimentEntry, ExperimentDetail } from '../types.js';
export declare class ExperimentsService {
    private experimentsDir;
    constructor(experimentsDir: string);
    listExperiments(): ExperimentEntry[];
    getExperiment(directory: string): ExperimentDetail | null;
    readFile(filePath: string): string | null;
    readFileRaw(filePath: string): Buffer | null;
    private listFilesRecursive;
    private parseTable;
}
