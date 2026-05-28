import type { ProductImportResult } from './types';

export interface ProductImportLog {
  id: string;
  sourceUrl: string;
  storeName: string;
  parserType: string;
  success: boolean;
  confidence: number;
  responseTimeMs: number;
  warnings: string[];
  createdAt: string;
}

const importLogs: ProductImportLog[] = [];

export function recordImportLog(result: ProductImportResult): ProductImportLog {
  const log: ProductImportLog = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sourceUrl: result.sourceUrl,
    storeName: result.store.name,
    parserType: result.parser.type,
    success: result.success,
    confidence: result.parser.confidence,
    responseTimeMs: result.metadata.responseTimeMs,
    warnings: result.parser.warnings,
    createdAt: new Date().toISOString(),
  };
  importLogs.unshift(log);
  importLogs.splice(100);
  return log;
}

export function getImportLogs(): ProductImportLog[] {
  return importLogs;
}
