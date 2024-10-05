import { getIndex } from '@/lib/client/pinecone';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { Embedding } from '@/types/settings';
import { toAscii } from '@/lib/utils';
import Bottleneck from 'bottleneck';
import { Index } from '@pinecone-database/pinecone';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';
import cliProgress from 'cli-progress';

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
  const start = Date.now();
  logger.info(chalk.blue('Chunking embeddings by size...'));

  // Initialize progress bar
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(embeddings.length, 0);

  const chunks: Embedding[][] = [];
  let currentChunk: Embedding[] = [];
  let currentSize = 0;

  for (const embedding of embeddings) {
    const embeddingSize = estimateEmbeddingSize(embedding);

    // Check if the metadata size exceeds 40KB
    if (!isMetadataSizeValid(embedding.metadata)) {
      logger.warn(
        chalk.yellow(
          'Metadata size exceeds 40KB for embedding. Skipping this record.'
        )
      );
      progressBar.increment();
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
    progressBar.increment();
  }

  // Push the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  progressBar.stop();
  const duration = Date.now() - start;
  logger.info(
    chalk.green('Chunking embeddings took ') + chalk.magenta(`${duration} ms`)
  );
  return chunks;
}

// Upsert function with chunking for 1000 records limit and 4MB size limit
export const upsertDocument = async (
  userId: string,
  embeddings: Embedding[]
) => {
  const start = Date.now();
  let upsertedChunkCount = 0;
  logger.info(chalk.blue(`Starting upsert for user ${userId}`));

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

  // Initialize progress bar
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(chunkedDataBySize.length, 0);

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
        await namespace.upsert(chunk);
        upsertedChunkCount += chunk.length;
        totalUpsertedSizePerSecond += chunkSize;

        // Update progress bar here
        progressBar.increment();

        break;
      } catch (error: any) {
        if (error.statusCode === 429) {
          logger.warn(
            chalk.yellow(
              `Rate limit hit during upsert for user ${userId}. Retrying after delay ${delay}ms`
            )
          );
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else if (error.message.includes('message length too large')) {
          logger.error(
            chalk.red(
              `Upsert failed for user ${userId} - message size exceeds 4MB limit. Chunk size: ${chunkSize} bytes`
            )
          );
          throw new Error('Upsert failed due to size limits.');
        } else {
          logger.error(
            chalk.red(
              `Failed to upsert for user ${userId}. Error: ${error.message}`
            )
          );
          throw error;
        }
      }
    }

    if (attempt === maxRetries) {
      const errorMessage = `Failed to upsert after ${maxRetries} attempts for user ${userId} due to rate limiting`;
      logger.error(chalk.red(errorMessage));
      throw new Error(errorMessage);
    }
  };

  // Schedule upserts with rate limiting and update progress bar after each upsert
  const upsertPromises = chunkedDataBySize.map((chunk) =>
    upsertLimiter.schedule(() => upsertChunkWithRetry(chunk))
  );

  await Promise.all(upsertPromises);
  progressBar.stop();

  logger.info(
    chalk.green(
      `Upsert completed for user ${userId} with ${upsertedChunkCount} records upserted`
    )
  );
  const duration = Date.now() - start;
  logger.info(
    chalk.green(`Upsert operation for user ${userId} took `) +
      chalk.magenta(`${duration} ms`)
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

export async function query(userId: string, embedding: any, topK: number) {
  const start = Date.now();
  let response;
  const maxResultSizeMB = 4; // The maximum allowed result size in MB
  const maxResultSizeBytes = maxResultSizeMB * 1024 * 1024; // Convert to bytes
  logger.info(
    chalk.blue(`Starting query for user ${userId} with topK=${topK}`)
  );

  try {
    response = await queryLimiter.schedule(() =>
      queryByNamespace(userId, topK, embedding.values)
    );
    logger.info(chalk.green(`Query successful for user ${userId}`));
  } catch (error: any) {
    logger.error(
      chalk.red(`Query failed for user ${userId} - Error: ${error.message}`)
    );

    if (error.message.includes('Result size limit exceeded')) {
      const currentResponseSizeBytes = getResponseSizeInBytes(response);
      const sizeOverLimit = currentResponseSizeBytes - maxResultSizeBytes;

      logger.warn(
        chalk.yellow(
          `Result size limit exceeded for user ${userId}. Current response size is ${currentResponseSizeBytes} bytes, which is ${sizeOverLimit} bytes over the limit.`
        )
      );

      const reductionFactor = maxResultSizeBytes / currentResponseSizeBytes;
      const adjustedTopK = Math.max(Math.floor(topK * reductionFactor), 1);

      logger.info(
        chalk.blue(
          `Reducing topK from ${topK} to ${adjustedTopK} for user ${userId} to fit within the result size limit.`
        )
      );

      response = await queryLimiter.schedule(() =>
        queryByNamespace(userId, adjustedTopK, embedding.values)
      );
      logger.info(
        chalk.green(
          `Query successful after reducing topK to ${adjustedTopK} for user ${userId}`
        )
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
      userId: item.metadata.userId,
      url: item.metadata.url,
      citation: item.metadata.citation
    };
    if (item.metadata.page_number) {
      contextItem.page_number = item.metadata.page_number.toString();
    }
    return contextItem;
  });

  const duration = Date.now() - start;
  logger.info(
    chalk.green(`Query operation for user ${userId} took `) +
      chalk.magenta(`${duration} ms`)
  );
  return {
    message: 'Pinecone query successful',
    namespace: userId,
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
  const start = Date.now();
  logger.info(chalk.blue(`Querying namespace ${namespace} with topK=${topK}`));
  const index = await getIndex();
  const result = await index.namespace(namespace).query({
    topK: Math.min(topK, 10000),
    vector: embeddedMessage,
    includeValues: false,
    includeMetadata: true
  });
  const duration = Date.now() - start;
  logger.info(
    chalk.green(`Querying namespace ${namespace} took `) +
      chalk.magenta(`${duration} ms`)
  );
  return result;
};

// Delete function with chunking for 1000 records limit
export async function deleteFromVectorDb(
  userId: string,
  file: KnowledgebaseFile
): Promise<number> {
  const start = Date.now();
  const pageSize = 100;
  let paginationToken: string | undefined;
  let deletedCount = 0;
  let allChunkIds: string[] = [];

  logger.info(
    chalk.blue(
      `Starting delete operation for user ${userId}, file ${file.name}`
    )
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

  // Initialize progress bar for delete operation
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(1000, 0); // Starts for 1000 chunks in this example

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

    allChunkIds = [...allChunkIds, ...result.chunks.map((chunk) => chunk.id)];

    while (allChunkIds.length >= 1000) {
      const idsToDelete = allChunkIds.splice(0, 1000);
      await deleteLimiter.schedule(() =>
        deleteChunks(idsToDelete, namespace, userId)
      );
      deletedCount += idsToDelete.length;
      progressBar.increment(idsToDelete.length);
    }

    paginationToken = result.paginationToken;
  } while (paginationToken !== undefined);

  if (allChunkIds.length > 0) {
    await deleteLimiter.schedule(() =>
      deleteChunks(allChunkIds, namespace, userId)
    );
    deletedCount += allChunkIds.length;
  }

  progressBar.stop();

  logger.info(
    chalk.green(
      `Delete operation completed for user ${userId}. Total records deleted: ${deletedCount}`
    )
  );
  const duration = Date.now() - start;
  logger.info(
    chalk.green(`Delete operation for user ${userId} took `) +
      chalk.magenta(`${duration} ms`)
  );
  return deletedCount;
}

// Helper function to delete chunks of IDs
const deleteChunks = async (
  ids: string[],
  namespace: Index,
  userId: string
) => {
  const start = Date.now();
  if (totalDeletedRecordsPerSecond + ids.length > MAX_DELETE_SIZE_PER_SECOND) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    totalDeletedRecordsPerSecond = 0;
  }

  try {
    await namespace.deleteMany(ids);
    totalDeletedRecordsPerSecond += ids.length;
  } catch (error: any) {
    logger.error(
      chalk.red(
        `Failed to delete records for user ${userId}. Error: ${error.message}`
      )
    );
    throw error;
  } finally {
    const duration = Date.now() - start;
    logger.info(
      chalk.green(`Deleting chunks for user ${userId} took `) +
        chalk.magenta(`${duration} ms`)
    );
  }
};

// List chunks for delete operation with pagination handling (limit must be between 1 and 100)
async function listArchiveChunks(
  file: KnowledgebaseFile,
  namespace: Index,
  limit: number,
  paginationToken?: string
): Promise<{ chunks: { id: string }[]; paginationToken?: string }> {
  const start = Date.now();
  logger.info(
    chalk.blue(
      `Listing archive chunks for file ${file.name} with limit ${limit}`
    )
  );
  const validLimit = Math.min(Math.max(limit, 1), 100);

  const listResult = await namespace.listPaginated({
    prefix: `${toAscii(file.name)}#${file.key}`,
    limit: validLimit,
    paginationToken: paginationToken
  });

  const chunks =
    listResult.vectors?.map((vector) => ({ id: vector.id || '' })) || [];
  const duration = Date.now() - start;
  logger.info(
    chalk.green(`Listing archive chunks for file ${file.name} took `) +
      chalk.magenta(`${duration} ms`)
  );
  return { chunks, paginationToken: listResult.pagination?.next };
}
