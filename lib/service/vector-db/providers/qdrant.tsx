import { Embedding } from '@/types/settings';
import { KnowledgebaseFile } from '@/types/file-uploader';
import {
  upsertDocument as qdrantUpsertDocument,
  query as qdrantQuery,
  deleteFromVectorDb as qdrantDeleteFromVectorDb
} from '@/lib/service/qdrant';
import { VectorDbProvider } from '@/types/vector-db';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';

export class QdrantProvider implements VectorDbProvider {
  async upsertDocument(
    userId: string,
    embeddings: Embedding[]
  ): Promise<number> {
    logger.info(
      chalk.blue(
        `Upserting document for userId: ${userId}, number of embeddings: ${embeddings.length}`
      )
    );

    try {
      const upsertedDocuments = await qdrantUpsertDocument(userId, embeddings);
      logger.info(
        chalk.green(`Successfully upserted document for userId: ${userId}`)
      );
      return upsertedDocuments;
    } catch (error: any) {
      logger.error(
        chalk.red(
          `Failed to upsert document for userId: ${userId}, error: ${
            error.message || error
          }`
        )
      );
      throw error;
    }
  }

  async query(
    userEmail: string,
    embeddings: { message: string; values: number[] },
    topK: number
  ): Promise<any> {
    logger.info(
      chalk.blue(
        `Querying embeddings for userEmail: ${userEmail}, topK: ${topK}`
      )
    );

    try {
      const result = await qdrantQuery(userEmail, embeddings, topK);
      logger.info(
        chalk.green(
          `Query successful for userEmail: ${userEmail}, found ${result.length} results`
        )
      );
      return result;
    } catch (error: any) {
      logger.error(
        chalk.red(
          `Failed to query embeddings for userEmail: ${userEmail}, error: ${
            error.message || error
          }`
        )
      );
      throw error;
    }
  }

  async deleteFromVectorDb(
    userId: string,
    file: KnowledgebaseFile
  ): Promise<number> {
    logger.info(
      chalk.blue(
        `Deleting from vector DB for userId: ${userId}, fileId: ${file.key}`
      )
    );

    try {
      const result = await qdrantDeleteFromVectorDb(userId, file);
      logger.info(
        chalk.green(
          `Successfully deleted from vector DB for userId: ${userId}, fileId: ${file.key}`
        )
      );
      return result;
    } catch (error: any) {
      logger.error(
        chalk.red(
          `Failed to delete from vector DB for userId: ${userId}, fileId: ${
            file.key
          }, error: ${error.message || error}`
        )
      );
      throw error;
    }
  }
}
