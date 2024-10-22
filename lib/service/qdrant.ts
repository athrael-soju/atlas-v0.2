import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { Embedding } from '@/types/settings';
import { logger } from '@/lib/service/winston'; // Import the Winston logger
import chalk from 'chalk'; // Import Chalk
import { client } from '@/lib/client/qdrant'; // Using the Qdrant client you've set up
import { KnowledgebaseFile } from '@/types/file-uploader';
import Bottleneck from 'bottleneck'; // Import Bottleneck
import pRetry from 'p-retry'; // Import p-retry for retry logic
import cliProgress from 'cli-progress'; // Import cliProgress for progress bars

const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'atlasv0.2';

// Updated Bottleneck configuration for controlled concurrency
const limiter = new Bottleneck({
  maxConcurrent: 3, // Increased concurrent requests to 3 for better throughput
  minTime: 100 // Minimum time between each request in milliseconds
});

export const upsertDocument = async (
  userId: string,
  embeddings: Embedding[],
  batchPercentage: number = 20 // Adjusted batch size to 20% for better balance
) => {
  const start = Date.now();
  logger.info(chalk.blue(`Starting upsert for user ${userId}`));

  if (embeddings.length === 0) {
    logger.warn(
      chalk.yellow(`No embeddings provided for upsert for user ${userId}`)
    );
    return 0;
  }

  // Calculate batch size based on the percentage of the total number of embeddings
  const batchSize = Math.ceil((embeddings.length * batchPercentage) / 100);
  logger.info(
    chalk.blue(
      `Total embeddings: ${embeddings.length}, Batch size: ${batchSize} (Percentage: ${batchPercentage}%)`
    )
  );

  let totalUpserted = 0;
  const batches = [];

  // Create batches of embeddings
  for (let i = 0; i < embeddings.length; i += batchSize) {
    batches.push(embeddings.slice(i, i + batchSize));
  }

  // Initialize progress bar for batch processing
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(batches.length, 0);

  // Process all batches concurrently with retry logic for better resilience
  await Promise.all(
    batches.map((batch, index) =>
      pRetry(
        () =>
          limiter.schedule(async () => {
            const points = batch.map((embedding) => ({
              id: uuidv4(),
              payload: {
                embeddingId: embedding.id,
                metadata: embedding.metadata || {}
              },
              vector: embedding.values
            }));

            try {
              await client.upsert(QDRANT_COLLECTION, { points });
              totalUpserted += batch.length;
              progressBar.increment();
            } catch (error) {
              logger.error(
                chalk.red(
                  `Failed to upsert batch for user ${userId}. Error: ${
                    (error as Error).message
                  }. Response: ${JSON.stringify((error as any).response?.data)}`
                )
              );
              throw error;
            }
          }),
        {
          retries: 3,
          onFailedAttempt: (error: { attemptNumber: any }) => {
            logger.warn(
              chalk.yellow(
                `Attempt ${error.attemptNumber} failed for upserting batch for user ${userId}. Retrying...`
              )
            );
          }
        }
      )
    )
  );

  progressBar.stop();

  const duration = Date.now() - start;
  logger.info(
    chalk.green(
      `Upsert completed for user ${userId}, total embeddings upserted: ${totalUpserted}`
    )
  );
  logger.info(
    chalk.green(`Upsert operation for user ${userId} took `) +
      chalk.magenta(`${duration} ms`)
  );
  return totalUpserted;
};

export async function query(
  userId: string,
  embedding: Embedding,
  topK: number
): Promise<any> {
  const start = Date.now();
  logger.info(
    chalk.blue(
      `query called with userId: ${userId}, embedding: ${embedding.values.length}, topK: ${topK}`
    )
  );

  try {
    if (embedding.values.length === 0) {
      throw new Error('No embedding provided for the query.');
    }

    // Using the first embedding for the query - this could be adjusted as needed
    const response = await client.search(QDRANT_COLLECTION, {
      vector: embedding.values,
      limit: topK,
      filter: {
        must: [
          {
            key: 'metadata.userId',
            match: {
              value: userId
            }
          }
        ]
      },
      with_payload: true,
      with_vector: false
    });

    logger.info(
      chalk.green(
        `Query successful for user ${userId}, retrieved ${response.length} results.`
      )
    );

    const context = response.map((item: any) => {
      const contextItem: any = {
        text: item.payload.metadata.text,
        filename: item.payload.metadata.filename,
        filetype: item.payload.metadata.filetype,
        languages: item.payload.metadata.languages?.join(', '),
        userId: item.payload.metadata.userId,
        url: item.payload.metadata.url,
        citation: item.payload.metadata.citation
      };
      if (item.payload.metadata.page_number) {
        contextItem.page_number = item.payload.metadata.page_number.toString();
      }
      return contextItem;
    });

    const duration = Date.now() - start;
    logger.info(
      chalk.green(`Query operation for user ${userId} took `) +
        chalk.magenta(`${duration} ms`)
    );
    return {
      message: 'Qdrant query successful',
      namespace: userId,
      context
    };
  } catch (error) {
    logger.error(
      chalk.red(
        `Query failed for user ${userId}. Error: ${(error as Error).message}`
      )
    );
    throw error;
  }
}

export async function deleteFromVectorDb(
  userId: string,
  file: KnowledgebaseFile
): Promise<number> {
  const start = Date.now();
  logger.info(
    chalk.blue(
      `Delete operation started for userId: ${userId}, file: ${JSON.stringify(
        file
      )}`
    )
  );

  try {
    const { name, url } = file;

    if (!name && !url) {
      throw new Error('No filename or URL provided for deletion.');
    }

    const filter = {
      must: [
        { key: 'metadata.filename', match: { value: name } },
        { key: 'metadata.url', match: { value: url } }
      ]
    };

    // Count the number of points to be deleted
    const countResponse = await client.count(QDRANT_COLLECTION, { filter });
    const pointsToDelete = countResponse.count || 0;

    if (pointsToDelete === 0) {
      logger.info(
        chalk.yellow(
          `No points found for deletion for user ${userId} and file ${
            name || url
          }`
        )
      );
      return 0;
    }

    // Use the Qdrant client to delete points based on the filename or URL filter
    await client.delete(QDRANT_COLLECTION, { filter });

    logger.info(
      chalk.green(
        `Successfully deleted ${pointsToDelete} vectors for user ${userId} and file ${
          name || url
        }`
      )
    );
    const duration = Date.now() - start;
    logger.info(
      chalk.green(`Delete operation for user ${userId} took `) +
        chalk.magenta(`${duration} ms`)
    );
    return pointsToDelete;
  } catch (error) {
    logger.error(
      chalk.red(
        `Failed to delete from vector DB for user ${userId}. Error: ${
          (error as Error).message
        }`
      )
    );
    throw error;
  }
}
