import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { Embedding } from '@/types/settings';
import { logger } from '@/lib/service/winston'; // Import the Winston logger
import chalk from 'chalk'; // Import Chalk
import { client } from '@/lib/client/qdrant'; // Using the Qdrant client you've set up
import { KnowledgebaseFile } from '@/types/file-uploader';
import Bottleneck from 'bottleneck'; // Import Bottleneck

const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'atlasv1';

const limiter = new Bottleneck({
  maxConcurrent: 1, // Limit to one concurrent request
  minTime: 200 // Minimum time between each request in milliseconds
});

export const upsertDocument = async (
  userId: string,
  embeddings: Embedding[],
  batchPercentage: number = 10 // Default batch size is 10% of total embeddings
) => {
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

  // Process the embeddings in batches
  for (let i = 0; i < embeddings.length; i += batchSize) {
    const batch = embeddings.slice(i, i + batchSize);

    // Prepare the points for the current batch
    const points = batch.map((embedding) => ({
      id: uuidv4(), // Generate a UUID for the point
      payload: {
        embeddingId: embedding.id, // The ID of the embedding
        metadata: embedding.metadata || {} // Attach any additional metadata if available
      },
      vector: embedding.values // The embedding's vector
    }));

    try {
      // Perform the upsert operation using the Qdrant client, limiting concurrency with Bottleneck
      await limiter.schedule(() =>
        client.upsert(QDRANT_COLLECTION, {
          points // The list of points (embeddings) to upsert
        })
      );
      totalUpserted += batch.length;
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
  }

  logger.info(
    chalk.green(
      `Upsert completed for user ${userId}, total embeddings upserted: ${totalUpserted}`
    )
  );
  return totalUpserted;
};

export async function query(
  userId: string,
  embedding: Embedding,
  topK: number
): Promise<any> {
  logger.info(
    `query called with userId: ${userId}, embedding: ${embedding.values.length}, topK: ${topK}`
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
        `Query successful for user ${userId}, retrieved ${response.values.length} results.`
      )
    );

    const context = response.map((item: any) => {
      const contextItem: any = {
        text: item.payload.metadata.text,
        filename: item.payload.metadata.filename,
        filetype: item.payload.metadata.filetype,
        languages: item.payload.metadata.languages.join(', '),
        userId: item.payload.metadata.userId,
        url: item.payload.metadata.url,
        citation: item.payload.metadata.citation
      };
      if (item.payload.metadata.page_number) {
        contextItem.page_number = item.payload.metadata.page_number.toString();
      }
      return contextItem;
    });

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
  logger.info(
    `deleteFromVectorDb called with userId: ${userId}, file: ${JSON.stringify(
      file
    )}`
  );

  try {
    // Extract the filename or URL from the file object
    const { name, url } = file;

    if (!name && !url) {
      throw new Error('No filename or URL provided for deletion.');
    }

    // Count the number of points to be deleted
    const countResponse = await client.count(QDRANT_COLLECTION, {
      filter: {
        must: [
          {
            key: 'metadata.filename',
            match: {
              value: name
            }
          },
          {
            key: 'metadata.url',
            match: {
              value: url
            }
          }
        ]
      }
    });

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
    await client.delete(QDRANT_COLLECTION, {
      filter: {
        must: [
          {
            key: 'metadata.filename',
            match: {
              value: name
            }
          },
          {
            key: 'metadata.url',
            match: {
              value: url
            }
          }
        ]
      }
    });

    // Log success and return the number of points deleted
    logger.info(
      chalk.green(
        `Successfully deleted ${pointsToDelete} vectors for user ${userId} and file ${
          name || url
        }`
      )
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
