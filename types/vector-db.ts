export interface VectorDbProvider {
  upsertDocument(userId: string, embeddings: any[]): Promise<number>;
  query(userId: string, embeddings: any, topK: number): Promise<any>;
  deleteFromVectorDb(userId: string, file: any): Promise<number>;
}
