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

  async query(userEmail: string, embeddings: any, topK: number): Promise<any> {
    return pineconeQuery(userEmail, embeddings, topK);
  }

  async deleteFromVectorDb(
    userId: string,
    file: KnowledgebaseFile
  ): Promise<number> {
    return pineconeDeleteFromVectorDb(userId, file);
  }
}
