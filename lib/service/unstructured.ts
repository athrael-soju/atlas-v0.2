import { KnowledgebaseFile } from '@/types/file-uploader';
import { ForgeSettings } from '@/types/settings';
import { unstructuredClient } from '@/lib/client/unstructured';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { Strategy } from 'unstructured-client/sdk/models/shared';

export async function parseAndChunk(
  forgeSettings: ForgeSettings,
  file: KnowledgebaseFile
): Promise<any> {
  const start = Date.now();

  // Initialize progress bar
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(100, 0);
  let progress = 0;
  const interval = setInterval(() => {
    if (progress < 99) {
      progress += 1;
      progressBar.update(progress);
    }
  }, 1000);

  try {
    logger.info(
      chalk.blue(`Starting parse and chunk operation for file: ${file.name}`)
    );

    // Simulate fetching the file
    const fileResponse = await fetch(file.url);
    const fileBlob = await fileResponse.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Prepare partition parameters
    const isCsv = file.name.endsWith('.csv');
    const isPdf = file.name.endsWith('.pdf');
    const partitionParameters: any = {
      files: {
        content: uint8Array,
        fileName: file.name
      },
      strategy: forgeSettings.partitioningStrategy
    };

    // Additional params for non-CSV files
    if (!isCsv) {
      partitionParameters.maxCharacters = forgeSettings.maxChunkSize;
      partitionParameters.overlap = forgeSettings.chunkOverlap;
      if (isPdf) {
        partitionParameters.splitPdfPage = true;
        partitionParameters.splitPdfAllowFailed = true;
        partitionParameters.splitPdfConcurrencyLevel = 10;
      }
      if (forgeSettings.partitioningStrategy !== Strategy.HiRes) {
        partitionParameters.chunkingStrategy = forgeSettings.chunkingStrategy;
      }
    }

    // Partition the document
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

    // Log total duration of the process
    const totalDuration = Date.now() - start;
    logger.info(
      chalk.green(
        `Total parse and chunk operation for file: ${file.name} took `
      ) + chalk.magenta(`${totalDuration} ms`)
    );

    // Stop the progress bar
    clearInterval(interval);
    progressBar.update(100);
    progressBar.stop();
    // TODO: Fix visual glitch with progress bar showing a 100% in a separate bar after stopping
    return parsedDataResponse?.elements || [];
  } catch (error: any) {
    // Stop the progress bar
    clearInterval(interval);
    progressBar.stop();

    logger.error(
      chalk.red(
        `Failed to parse and chunk the file: ${file.name}. Error: ${error.message}`
      ),
      error.stack
    );
    throw error;
  }
}
