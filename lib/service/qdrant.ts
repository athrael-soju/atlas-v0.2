import client from '@/lib/client/qdrant';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { Embedding } from '@/types/settings';
import { toAscii } from '@/lib/utils';
import Bottleneck from 'bottleneck';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';

export async function upsertDocument(
  userId: string,
  embeddings: Embedding[]
): Promise<number> {
  logger.info(
    `upsertDocument called with userId: ${userId}, embeddings count: ${embeddings.length}`
  );

  // Throwing an unimplemented exception
  throw new Error('upsertDocument function is not implemented');
}

export async function query(
  userEmail: string,
  embeddings: any,
  topK: number
): Promise<any> {
  logger.info(
    `query called with userEmail: ${userEmail}, embeddings: ${embeddings.length}, topK: ${topK}`
  );

  // Throwing an unimplemented exception
  throw new Error('query function is not implemented');
}

export async function deleteFromVectorDb(
  userId: string,
  file: KnowledgebaseFile
): Promise<number> {
  logger.info(
    `deleteFromVectorDb called with userId: ${userId}, file: ${JSON.stringify(
      file
    )}`
  );

  // Throwing an unimplemented exception
  throw new Error('deleteFromVectorDb function is not implemented');
}
