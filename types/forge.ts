export interface ForgeSettings {
  parsingProvider: string;
  partitioningStrategy: string;
  chunkingStrategy: string;
  minChunkSize: number;
  maxChunkSize: number;
  chunkOverlap: number;
  chunkBatch: number;
}
