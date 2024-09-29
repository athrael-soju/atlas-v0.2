import { KnowledgebaseFile } from '@/types/file-uploader';
import { ForgeSettings } from '@/types/settings';
import { unstructuredClient } from '@/lib/client/unstructured';

export async function parseAndChunk(
  forgeSettings: ForgeSettings,
  file: KnowledgebaseFile
): Promise<any> {
  const fileResponse = await fetch(file.url);

  // Convert ReadableStream to Blob
  const fileBlob = await fileResponse.blob();

  // Convert Blob to ArrayBuffer
  const arrayBuffer = await fileBlob.arrayBuffer();

  // Convert ArrayBuffer to Uint8Array
  const uint8Array = new Uint8Array(arrayBuffer);

  const isCsv = file.name.endsWith('.csv');
  const partitionParameters: any = {
    files: {
      content: uint8Array, // Use Uint8Array here
      fileName: file.name
    },
    strategy: forgeSettings.partitioningStrategy
  };

  if (!isCsv) {
    partitionParameters.chunkingStrategy = forgeSettings.chunkingStrategy;
    partitionParameters.maxCharacters = forgeSettings.maxChunkSize;
    partitionParameters.overlap = forgeSettings.chunkOverlap;
    partitionParameters.splitPdfPage = false; // TODO Look into why it's failing with local container
    partitionParameters.splitPdfAllowFailed = true;
    partitionParameters.splitPdfConcurrencyLevel = 10;
  }

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
  return parsedDataResponse?.elements || [];
}
