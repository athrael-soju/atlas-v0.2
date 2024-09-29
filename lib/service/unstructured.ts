import { KnowledgebaseFile } from '@/types/file-uploader';
import { ForgeSettings } from '@/types/settings';
import { unstructuredClient } from '@/lib/client/unstructured';
import { logger } from '@/lib/service/winston';

export async function parseAndChunk(
  forgeSettings: ForgeSettings,
  file: KnowledgebaseFile
): Promise<any> {
  try {
    if (forgeSettings.parsingProvider === 'ioc') {
      logger.info('Using Unstructured.io (serverless)...');
      const apiKey = process.env['UNSTRUCTURED_API'];
      if (!apiKey) {
        throw new Error('UNSTRUCTURED_API is not set');
      }

      unstructuredClient._options.security = {
        apiKeyAuth: apiKey
      };
    } else {
      logger.info('Using Unstructured.io (local)');
    }

    logger.info(`Parsing and chunking the file: ${file.name}`);
    // Fetch the file from the provided URL
    const fileResponse = await fetch(file.url);
    logger.info(`Fetched file from URL: ${file.url}`);

    // Convert ReadableStream to Blob
    const fileBlob = await fileResponse.blob();
    logger.info(`Converted file to Blob for further processing.`);

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await fileBlob.arrayBuffer();
    logger.info(`Converted Blob to ArrayBuffer.`);

    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);
    logger.info(`Converted ArrayBuffer to Uint8Array.`);

    // Check if the file is a CSV
    const isCsv = file.name.endsWith('.csv');
    logger.info(`File type determined: ${isCsv ? 'CSV' : 'Non-CSV'}`);

    // Prepare the partition parameters
    const partitionParameters: any = {
      files: {
        content: uint8Array,
        fileName: file.name
      },
      strategy: forgeSettings.partitioningStrategy
    };

    if (!isCsv) {
      partitionParameters.chunkingStrategy = forgeSettings.chunkingStrategy;
      partitionParameters.maxCharacters = forgeSettings.maxChunkSize;
      partitionParameters.overlap = forgeSettings.chunkOverlap;
      if (forgeSettings.parsingProvider === 'iol') {
        partitionParameters.splitPdfPage = false; // TODO: Find out why it fails when true
      } else {
        partitionParameters.splitPdfPage = true;
        partitionParameters.splitPdfAllowFailed = true;
        partitionParameters.splitPdfConcurrencyLevel = 10;
      }
      logger.info(`Configured partition parameters for non-CSV file.`);
    }

    // Log the partitioning strategy
    logger.info(`Partitioning strategy: ${forgeSettings.partitioningStrategy}`);

    // Call the unstructured client to partition the document
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

    // Log the success of the partitioning process
    logger.info(`Successfully partitioned the document: ${file.name}`);

    // Return the partitioned elements
    return parsedDataResponse?.elements || [];
  } catch (error: any) {
    // Log the error with file information
    logger.error(
      `Failed to parse and chunk the file: ${file.name}. Error: ${error.message}`
    );
    throw error;
  }
}
