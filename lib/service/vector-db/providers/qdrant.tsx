import { Embedding } from '@/types/settings';
import { KnowledgebaseFile } from '@/types/file-uploader';
import {
  upsertDocument as qdrantUpsertDocument,
  query as qdrantQuery,
  deleteFromVectorDb as qdrantDeleteFromVectorDb
} from '@/lib/service/qdrant';
import { VectorDbProvider } from '@/types/vector-db';

export class QdrantProvider implements VectorDbProvider {
  async upsertDocument(
    userId: string,
    embeddings: Embedding[]
  ): Promise<number> {
    return qdrantUpsertDocument(userId, embeddings);
  }

  async query(userEmail: string, embeddings: any, topK: number): Promise<any> {
    return qdrantQuery(userEmail, embeddings, topK);
  }

  async deleteFromVectorDb(
    userId: string,
    file: KnowledgebaseFile
  ): Promise<number> {
    return qdrantDeleteFromVectorDb(userId, file);
  }
}
