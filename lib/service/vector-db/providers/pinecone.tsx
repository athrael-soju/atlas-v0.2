import { Embedding } from '@/types/settings';
import { KnowledgebaseFile } from '@/types/file-uploader';
import {
  upsertDocument as pineconeUpsertDocument,
  query as pineconeQuery,
  deleteFromVectorDb as pineconeDeleteFromVectorDb
} from '@/lib/service/pinecone';
import { VectorDbProvider } from '@/types/vector-db';

export class PineconeProvider implements VectorDbProvider {
  async upsertDocument(
    userId: string,
    embeddings: Embedding[]
  ): Promise<number> {
    return pineconeUpsertDocument(userId, embeddings);
  }

  async query(
    userId: string,
    embedding: Embedding,
    topK: number
  ): Promise<any> {
    return pineconeQuery(userId, embedding, topK);
  }

  async deleteFromVectorDb(
    userId: string,
    file: KnowledgebaseFile
  ): Promise<number> {
    return pineconeDeleteFromVectorDb(userId, file);
  }
}
