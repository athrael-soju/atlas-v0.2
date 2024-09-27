import { getIndex } from '@/lib/client/pinecone';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { Embedding } from '@/types/settings';
import { toAscii } from '@/lib/utils';
import Bottleneck from 'bottleneck';
import { Index } from '@pinecone-database/pinecone';

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export async function query(userEmail: string, embeddings: any, topK: number) {
  const response = await queryByNamespace(userEmail, topK, embeddings.values);
  const context = response.matches.map((item: any) => {
    const contextItem: any = {
      text: item.metadata.text,
      filename: item.metadata.filename,
      filetype: item.metadata.filetype,
      languages: item.metadata.languages.join(', '),
      user_email: item.metadata.user_email,
      url: item.metadata.url,
      citation: item.metadata.citation
    };
    // If file is CSV, there is always 1 page.
    if (item.metadata.page_number) {
      contextItem.page_number = item.metadata.page_number.toString();
    }
    return contextItem;
  });

  return {
    message: 'Pinecone query successful',
    namespace: userEmail,
    context
  };
}

const queryByNamespace = async (
  namespace: string,
  topK: number,
  embeddedMessage: any
) => {
  const index = await getIndex();
  const result = await index.namespace(namespace).query({
    topK: topK,
    vector: embeddedMessage,
    includeValues: false,
    includeMetadata: true
  });
  return result;
};

export const upsertDocument = async (
  userId: string,
  embeddings: Embedding[],
  chunkBatch: number
) => {
  let upsertedChunkCount = 0;
  const index = await getIndex();

  // Create a limiter for upsert operations
  const upsertLimiter = new Bottleneck({
    reservoir: 100, // Maximum number of records per second per namespace
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 1000, // 1 second
    maxConcurrent: 100, // Max concurrent upsert requests
    minTime: 1 // Minimum time between requests
  });

  // Function to upsert a chunk with retry and exponential backoff
  const upsertChunkWithRetry = async (chunk: Embedding[]) => {
    const namespace = index.namespace(userId);
    const maxRetries = 5;
    let attempt = 0;
    let delay = 500; // Initial delay in ms

    while (attempt < maxRetries) {
      try {
        await namespace.upsert(chunk);
        upsertedChunkCount += chunk.length;
        break; // Success
      } catch (error: any) {
        if (error.statusCode === 429) {
          // Too many requests, wait and retry
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          // Other error, rethrow
          throw error;
        }
      }
    }
    if (attempt === maxRetries) {
      throw new Error(
        `Failed to upsert after ${maxRetries} attempts due to rate limiting`
      );
    }
  };

  // Ensure each chunk does not exceed 1000 records
  const maxRecordsPerUpsert = 1000;
  const chunkedData = chunkArray(
    embeddings,
    Math.min(chunkBatch, maxRecordsPerUpsert)
  );

  // Schedule upserts with rate limiting
  const upsertPromises = chunkedData.map((chunk) =>
    upsertLimiter.schedule(() => upsertChunkWithRetry(chunk))
  );

  await Promise.all(upsertPromises);

  return upsertedChunkCount;
};

export async function deleteFromVectorDb(
  userId: string,
  file: KnowledgebaseFile
): Promise<number> {
  const pageSize = 100;
  let paginationToken: string | undefined;
  let deletedCount = 0;

  const index = await getIndex();
  const namespace = index.namespace(userId);

  // Create a limiter for delete operations
  const deleteLimiter = new Bottleneck({
    reservoir: 100, // Maximum number of updates per second per namespace
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 1000, // 1 second
    maxConcurrent: 100, // Max concurrent delete requests
    minTime: 1 // Minimum time between requests
  });

  do {
    const result = await listArchiveChunks(
      file,
      namespace,
      pageSize,
      paginationToken
    );
    if (result.chunks.length === 0) {
      break;
    }

    const chunkIds = result.chunks.map((chunk) => chunk.id);

    // Function to delete chunks with retry and exponential backoff
    const deleteChunksWithRetry = async (ids: string[]) => {
      const maxRetries = 5;
      let attempt = 0;
      let delay = 500;

      while (attempt < maxRetries) {
        try {
          await namespace.deleteMany(ids);
          deletedCount += ids.length;
          break;
        } catch (error: any) {
          if (error.statusCode === 429) {
            attempt++;
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            throw error;
          }
        }
      }
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to delete after ${maxRetries} attempts due to rate limiting`
        );
      }
    };

    await deleteLimiter.schedule(() => deleteChunksWithRetry(chunkIds));
    paginationToken = result.paginationToken;
  } while (paginationToken !== undefined);
  return deletedCount;
}

async function listArchiveChunks(
  file: KnowledgebaseFile,
  namespace: Index,
  limit: number,
  paginationToken?: string
): Promise<{ chunks: { id: string }[]; paginationToken?: string }> {
  const listResult = await namespace.listPaginated({
    prefix: `${toAscii(file.name)}#${file.key}`,
    limit: limit,
    paginationToken: paginationToken
  });

  const chunks =
    listResult.vectors?.map((vector) => ({ id: vector.id || '' })) || [];
  return { chunks, paginationToken: listResult.pagination?.next };
}
