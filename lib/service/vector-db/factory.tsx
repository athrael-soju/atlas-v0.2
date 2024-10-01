import { PineconeProvider } from './providers/pinecone';
import { QdrantProvider } from './providers/qdrant';

export function getVectorDbProvider(provider: string) {
  switch (provider) {
    case 'pcs':
      return new PineconeProvider();
    case 'qdl':
      return new QdrantProvider();
    default:
      throw new Error('Invalid Vector DB Provider');
  }
}
