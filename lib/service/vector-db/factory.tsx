import chalk from 'chalk';
import { PineconeProvider } from './providers/pinecone';
import { QdrantProvider } from './providers/qdrant';
import { logger } from '@/lib/service/winston';

export async function getVectorDbProvider(provider: string) {
  logger.info(chalk.green(`Requested Vector DB Provider: ${provider}`));
  switch (provider) {
    case 'pcs':
      logger.info(chalk.blue('Returning PineconeProvider instance'));
      return new PineconeProvider();
    case 'qdl':
      logger.info(chalk.blue('Returning QdrantProvider instance'));
      return new QdrantProvider();
    default:
      logger.error(chalk.red(`Invalid Vector DB Provider: ${provider}`));
      throw new Error('Invalid Vector DB Provider');
  }
}
