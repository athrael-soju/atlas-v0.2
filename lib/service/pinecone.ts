import { getIndex } from '@/lib/client/pinecone';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { Embedding } from '@/types/settings';
import { toAscii } from '@/lib/utils';
import Bottleneck from 'bottleneck';
import { Index } from '@pinecone-database/pinecone';
import { logger } from '@/lib/service/winston';

const MAX_UPSERT_SIZE_BYTES = 4 * 1024 * 1024; // 4MB limit for Pinecone
const MAX_METADATA_SIZE_BYTES = 40 * 1024; // 40KB limit for metadata
const MAX_UPSERT_SIZE_PER_SECOND = 50 * 1024 * 1024; // 50MB/sec upsert limit
const MAX_DELETE_SIZE_PER_SECOND = 5000; // 5,000 records/sec delete limit

let totalUpsertedSizePerSecond = 0;
let totalDeletedRecordsPerSecond = 0;

// Helper function to estimate the size of an embedding in bytes
function estimateEmbeddingSize(embedding: Embedding): number {
  return JSON.stringify(embedding).length;
}

// Helper function to estimate the size of an embedding's metadata in bytes
function estimateMetadataSize(metadata: any): number {
  return JSON.stringify(metadata).length;
}

// Function to check if the metadata size exceeds the 40 KB limit
function isMetadataSizeValid(metadata: any): boolean {
  return estimateMetadataSize(metadata) <= MAX_METADATA_SIZE_BYTES;
}

// Function to chunk embeddings based on size and the 4MB limit, ensuring metadata is under 40KB
function chunkEmbeddingsBySize(
  embeddings: Embedding[],
  maxSize: number
): Embedding[][] {
  const chunks: Embedding[][] = [];
  let currentChunk: Embedding[] = [];
  let currentSize = 0;

  for (const embedding of embeddings) {
    const embeddingSize = estimateEmbeddingSize(embedding);

    // Check if the metadata size exceeds 40KB
    if (!isMetadataSizeValid(embedding.metadata)) {
      logger.warn(
        `Metadata size exceeds 40KB for embedding. Skipping this record.`
      );
      continue; // Skip this embedding if the metadata is too large
    }

    // If adding the current embedding exceeds the max size, start a new chunk
    if (currentSize + embeddingSize > maxSize) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(embedding);
    currentSize += embeddingSize;
  }

  // Push the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Upsert function with chunking for 1000 records limit and 4MB size limit
export const upsertDocument = async (
  userId: string,
  embeddings: Embedding[]
) => {
  let upsertedChunkCount = 0;
  logger.info(`Starting upsert for user ${userId}`);

  const index = await getIndex();
  const upsertLimiter = new Bottleneck({
    reservoir: 100,
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 1000,
    maxConcurrent: 100,
    minTime: 1
  });

  // Split embeddings into chunks that fit within the 4MB limit and ensure metadata is under 40KB
  const chunkedDataBySize = chunkEmbeddingsBySize(
    embeddings,
    MAX_UPSERT_SIZE_BYTES
  );

  const upsertChunkWithRetry = async (chunk: Embedding[]) => {
    const namespace = index.namespace(userId);
    const chunkSize = chunk.reduce(
      (total, embedding) => total + estimateEmbeddingSize(embedding),
      0
    );

    if (totalUpsertedSizePerSecond + chunkSize > MAX_UPSERT_SIZE_PER_SECOND) {
      // Wait until the next second to avoid exceeding 50 MB/sec
      await new Promise((resolve) => setTimeout(resolve, 1000));
      totalUpsertedSizePerSecond = 0;
    }

    const maxRetries = 5;
    let attempt = 0;
    let delay = 500;

    while (attempt < maxRetries) {
      try {
        logger.info(
          `Attempting to upsert chunk of ${
            chunk.length
          } embeddings for user ${userId}, attempt ${attempt + 1}`
        );
        await namespace.upsert(chunk);
        upsertedChunkCount += chunk.length;
        totalUpsertedSizePerSecond += chunkSize;
        logger.info(
          `Successfully upserted chunk of ${chunk.length} embeddings for user ${userId}`
        );
        break;
      } catch (error: any) {
        if (error.statusCode === 429) {
          logger.warn(
            `Rate limit hit during upsert for user ${userId}. Retrying after delay ${delay}ms`
          );
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else if (error.message.includes('message length too large')) {
          logger.error(
            `Upsert failed for user ${userId} - message size exceeds 4MB limit. Chunk size: ${chunkSize} bytes`
          );
          throw new Error(`Upsert failed due to size limits.`);
        } else {
          logger.error(
            `Failed to upsert for user ${userId}. Error: ${error.message}`
          );
          throw error;
        }
      }
    }

    if (attempt === maxRetries) {
      const errorMessage = `Failed to upsert after ${maxRetries} attempts for user ${userId} due to rate limiting`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Schedule upserts with rate limiting
  const upsertPromises = chunkedDataBySize.map((chunk) =>
    upsertLimiter.schedule(() => upsertChunkWithRetry(chunk))
  );

  await Promise.all(upsertPromises);

  logger.info(
    `Upsert completed for user ${userId} with ${upsertedChunkCount} records upserted`
  );
  return upsertedChunkCount;
};

// Query function with size limit handling
const queryLimiter = new Bottleneck({
  reservoir: 2000, // max 2000 read units per second
  reservoirRefreshAmount: 2000,
  reservoirRefreshInterval: 1000, // 1 second
  maxConcurrent: 100,
  minTime: 1
});

export async function query(userEmail: string, embeddings: any, topK: number) {
  let response;
  const maxResultSizeMB = 4; // The maximum allowed result size in MB
  const maxResultSizeBytes = maxResultSizeMB * 1024 * 1024; // Convert to bytes
  logger.info(`Starting query for user ${userEmail} with topK=${topK}`);

  try {
    response = await queryLimiter.schedule(() =>
      queryByNamespace(userEmail, topK, embeddings.values)
    );
    logger.info(`Query successful for user ${userEmail}`);
  } catch (error: any) {
    logger.error(
      `Query failed for user ${userEmail} - Error: ${error.message}`
    );

    if (error.message.includes('Result size limit exceeded')) {
      const currentResponseSizeBytes = getResponseSizeInBytes(response);
      const sizeOverLimit = currentResponseSizeBytes - maxResultSizeBytes;

      logger.warn(
        `Result size limit exceeded for user ${userEmail}. Current response size is ${currentResponseSizeBytes} bytes, which is ${sizeOverLimit} bytes over the limit.`
      );

      const reductionFactor = maxResultSizeBytes / currentResponseSizeBytes;
      const adjustedTopK = Math.max(Math.floor(topK * reductionFactor), 1);

      logger.info(
        `Reducing topK from ${topK} to ${adjustedTopK} for user ${userEmail} to fit within the result size limit.`
      );

      response = await queryLimiter.schedule(() =>
        queryByNamespace(userEmail, adjustedTopK, embeddings.values)
      );
      logger.info(
        `Query successful after reducing topK to ${adjustedTopK} for user ${userEmail}`
      );
    } else {
      throw error;
    }
  }

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

// Helper function to calculate the size of the response in bytes
function getResponseSizeInBytes(response: any): number {
  let totalSize = 0;
  response.matches.forEach((match: any) => {
    const metadataSize = JSON.stringify(match.metadata).length;
    totalSize += metadataSize;
  });
  return totalSize;
}

// Query function with size limit handling, without including dense vector values
const queryByNamespace = async (
  namespace: string,
  topK: number,
  embeddedMessage: any
) => {
  logger.info(`Querying namespace ${namespace} with topK=${topK}`);
  const index = await getIndex();
  const result = await index.namespace(namespace).query({
    topK: Math.min(topK, 10000),
    vector: embeddedMessage,
    includeValues: false,
    includeMetadata: true
  });
  return result;
};

// Delete function with chunking for 1000 records limit
export async function deleteFromVectorDb(
  userId: string,
  file: KnowledgebaseFile
): Promise<number> {
  const pageSize = 100;
  let paginationToken: string | undefined;
  let deletedCount = 0;
  let allChunkIds: string[] = [];

  logger.info(
    `Starting delete operation for user ${userId}, file ${file.name}`
  );
  const index = await getIndex();
  const namespace = index.namespace(userId);

  const deleteLimiter = new Bottleneck({
    reservoir: 100,
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 1000,
    maxConcurrent: 100,
    minTime: 1
  });

  do {
    const result = await listArchiveChunks(
      file,
      namespace,
      pageSize,
      paginationToken
    );

    if (result.chunks.length === 0) {
      logger.info(
        `No more chunks found for file ${file.name}. Proceeding with deletion.`
      );
      break;
    }

    allChunkIds = [...allChunkIds, ...result.chunks.map((chunk) => chunk.id)];

    while (allChunkIds.length >= 1000) {
      const idsToDelete = allChunkIds.splice(0, 1000);
      await deleteLimiter.schedule(() =>
        deleteChunks(idsToDelete, namespace, userId)
      );
      deletedCount += idsToDelete.length;
    }

    paginationToken = result.paginationToken;
  } while (paginationToken !== undefined);

  if (allChunkIds.length > 0) {
    await deleteLimiter.schedule(() =>
      deleteChunks(allChunkIds, namespace, userId)
    );
    deletedCount += allChunkIds.length;
  }

  logger.info(
    `Delete operation completed for user ${userId}. Total records deleted: ${deletedCount}`
  );
  return deletedCount;
}

// Helper function to delete chunks of IDs
const deleteChunks = async (
  ids: string[],
  namespace: Index,
  userId: string
) => {
  if (totalDeletedRecordsPerSecond + ids.length > MAX_DELETE_SIZE_PER_SECOND) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    totalDeletedRecordsPerSecond = 0;
  }

  try {
    logger.info(
      `Attempting to delete ${ids.length} records for user ${userId}`
    );
    await namespace.deleteMany(ids);
    totalDeletedRecordsPerSecond += ids.length;
    logger.info(
      `Successfully deleted ${ids.length} records for user ${userId}`
    );
  } catch (error: any) {
    logger.error(
      `Failed to delete records for user ${userId}. Error: ${error.message}`
    );
    throw error;
  }
};

// List chunks for delete operation with pagination handling (limit must be between 1 and 100)
async function listArchiveChunks(
  file: KnowledgebaseFile,
  namespace: Index,
  limit: number,
  paginationToken?: string
): Promise<{ chunks: { id: string }[]; paginationToken?: string }> {
  logger.info(`Listing chunks for file ${file.name}, limit ${limit}`);
  const validLimit = Math.min(Math.max(limit, 1), 100);

  const listResult = await namespace.listPaginated({
    prefix: `${toAscii(file.name)}#${file.key}`,
    limit: validLimit,
    paginationToken: paginationToken
  });

  const chunks =
    listResult.vectors?.map((vector) => ({ id: vector.id || '' })) || [];
  logger.info(`Found ${chunks.length} chunks for file ${file.name}`);
  return { chunks, paginationToken: listResult.pagination?.next };
}
