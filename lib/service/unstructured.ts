import { KnowledgebaseFile } from '@/types/file-uploader';
import { ForgeSettings } from '@/types/settings';
import { unstructuredClient } from '@/lib/client/unstructured';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';

export async function parseAndChunk(
  forgeSettings: ForgeSettings,
  file: KnowledgebaseFile
): Promise<any> {
  try {
    // Determine parsing provider and log the appropriate message
    if (forgeSettings.parsingProvider === 'ioc') {
      logger.info(chalk.blue('Using Unstructured.io (serverless)...'));
      const apiKey = process.env['UNSTRUCTURED_API'];
      if (!apiKey) {
        throw new Error(chalk.red('UNSTRUCTURED_API is not set'));
      }

      // Set API key for Unstructured.io client
      unstructuredClient._options.security = {
        apiKeyAuth: apiKey
      };
    } else {
      logger.info(chalk.blue('Using Unstructured.io (local)'));
    }

    logger.info(chalk.blue(`Parsing and chunking the file: ${file.name}`));

    // Fetch the file from the provided URL
    const fileResponse = await fetch(file.url);
    logger.info(chalk.green(`Fetched file from URL: ${file.url}`));

    // Convert ReadableStream to Blob for processing
    const fileBlob = await fileResponse.blob();
    logger.info(chalk.green('Converted file to Blob for further processing.'));

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await fileBlob.arrayBuffer();
    logger.info(chalk.green('Converted Blob to ArrayBuffer.'));

    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);
    logger.info(chalk.green('Converted ArrayBuffer to Uint8Array.'));

    // Check if the file is a CSV based on the extension
    const isCsv = file.name.endsWith('.csv');
    logger.info(
      chalk.yellow(`File type determined: ${isCsv ? 'CSV' : 'Non-CSV'}`)
    );

    // Prepare the partition parameters based on file type and settings
    const partitionParameters: any = {
      files: {
        content: uint8Array,
        fileName: file.name
      },
      strategy: forgeSettings.partitioningStrategy
    };

    // Set additional parameters for non-CSV files
    if (!isCsv) {
      partitionParameters.chunkingStrategy = forgeSettings.chunkingStrategy;
      partitionParameters.maxCharacters = forgeSettings.maxChunkSize;
      partitionParameters.overlap = forgeSettings.chunkOverlap;

      // PDF-specific settings
      if (forgeSettings.parsingProvider === 'iol') {
        partitionParameters.splitPdfPage = false; // Disable due to potential issues
      } else {
        partitionParameters.splitPdfPage = true;
        partitionParameters.splitPdfAllowFailed = true;
        partitionParameters.splitPdfConcurrencyLevel = 10;
      }
      logger.info(
        chalk.green('Configured partition parameters for non-CSV file.')
      );
    }

    // Log the partitioning strategy being used
    logger.info(
      chalk.blue(`Partitioning strategy: ${forgeSettings.partitioningStrategy}`)
    );

    // Call the Unstructured client to partition the document
    const parsedDataResponse = await unstructuredClient.general.partition(
      {
        partitionParameters
      },
      {
        retries: {
          strategy: 'backoff',
          backoff: {
            initialInterval: 1,
            maxInterval: 50,
            exponent: 1.1,
            maxElapsedTime: 100
          },
          retryConnectionErrors: false
        }
      }
    );

    // Return the partitioned elements
    return parsedDataResponse?.elements || [];
  } catch (error: any) {
    // Log any error encountered, with details about the file being processed
    logger.error(
      chalk.red(
        `Failed to parse and chunk the file: ${file.name}. Error: ${error.message}`
      )
    );
    throw error;
  }
}
