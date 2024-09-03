import { UnstructuredClient } from 'unstructured-client';
import * as fs from 'fs';
import { UploadedFile } from '@/types/file-uploader';
import { ForgeSettings } from '@/types/forge';

const apiKey = process.env.UNSTRUCTURED_API;
const serverURL = process.env.UNSTRUCTURED_SERVER_URL;

if (!apiKey) {
  throw new Error('UNSTRUCTURED_API is not set');
}

const unstructuredClient = new UnstructuredClient({
  security: {
    apiKeyAuth: apiKey
  },
  serverURL
});

export async function parseAndChunk(
  userId: string,
  forgeSettings: ForgeSettings,
  file: UploadedFile
): Promise<void> {
  const fileData = fs.readFileSync(file.url);
  // const fileContent = file.content as File;
  const isCsv = file.name.endsWith('.csv');
  const partitionParameters: any = {
    files: {
      content: fileData,
      fileName: file.name
    }
    //strategy: partitioningStrategy
  };
  // if (!isCsv) {
  //   partitionParameters.chunkingStrategy = chunkingStrategy;
  //   partitionParameters.maxCharacters = maxChunkSize;
  //   partitionParameters.overlap = chunkOverlap;
  //   partitionParameters.splitPdfPage = true;
  //   partitionParameters.splitPdfConcurrencyLevel = 10;
  // }
  // const parsedDataResponse = await unstructuredClient.general.partition(
  //   {
  //     partitionParameters,
  //   },
  //   {
  //     retries: {
  //       strategy: 'backoff',
  //       backoff: {
  //         initialInterval: 1,
  //         maxInterval: 50,
  //         exponent: 1.1,
  //         maxElapsedTime: 100,
  //       },
  //       retryConnectionErrors: false,
  //     },
  //   }
  // );
  // return parsedDataResponse?.elements || [];
}
