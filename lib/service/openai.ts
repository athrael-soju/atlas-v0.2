import { KnowledgebaseFile } from '@/types/file-uploader';
import OpenAI, { ClientOptions } from 'openai';
import { toAscii } from '@/lib/utils';
import { ParsedElement } from '@/types/settings';
import { Thread } from 'openai/resources/beta/threads/threads.mjs';
import { FileDeleted, FileObject } from 'openai/resources/index.mjs';
import Bottleneck from 'bottleneck';

const embeddingApiModel =
  process.env.OPENAI_API_EMBEDDING_MODEL || 'text-embedding-3-large';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

const options: ClientOptions = { apiKey: process.env.OPENAI_API_KEY };
const openai = new OpenAI(options);

const transformObjectValues = (
  obj: Record<string, any>
): Record<string, any> => {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (typeof value === 'object' && value !== null) {
        acc[key] = Object.entries(value).map(
          ([k, v]) => `${k}:${JSON.stringify(v)}`
        );
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>
  );
};

export async function embedMessage(userId: string, content: string) {
  const messageToEmbed = `Date: ${new Date().toLocaleString()}. User: ${userId}. Message: ${content}. Metadata: ${''}`;

  const response = await openai.embeddings.create({
    model: embeddingApiModel,
    input: messageToEmbed,
    encoding_format: 'float'
  });

  const embeddingValues = response.data[0].embedding;

  return {
    message: 'Message embeddings generated successfully',
    values: embeddingValues
  };
}

export async function embedDocument(
  userId: string,
  file: KnowledgebaseFile,
  chunks: ParsedElement[]
) {
  const chunkIdList: string[] = [];

  // Initialize Bottleneck limiter
  const limiter = new Bottleneck({
    reservoir: 3000, // Maximum number of requests per minute
    reservoirRefreshAmount: 3000,
    reservoirRefreshInterval: 60 * 1000, // 60 seconds
    minTime: 1, // Minimum time between requests (in ms)
    maxConcurrent: 60 // Increased to the highest possible number without breaching RPM limit
  });

  // Define a function to process each chunk
  async function processChunk(chunk: any, index: number) {
    const response = await openai.embeddings.create({
      model: embeddingApiModel,
      input: chunk.text,
      encoding_format: 'float'
    });

    const transformedMetadata = transformObjectValues(chunk.metadata);

    const newId = `${toAscii(file.name)}#${file.key}#${index + 1}`;
    chunkIdList.push(newId);
    const embeddingValues = response.data[0].embedding;

    // Add citation field to the metadata
    const pageInfo = chunk.metadata.page_number
      ? `, Page ${chunk.metadata.page_number}`
      : '';
    const citation = `[${file.url}](${file.name}${pageInfo})`;

    const metadata = {
      ...transformedMetadata,
      text: chunk.text,
      userId: userId,
      url: file.url,
      citation: citation
    };

    return {
      id: newId,
      values: embeddingValues,
      metadata: metadata
    };
  }

  // Map over chunks using limiter.schedule
  const embeddings = await Promise.all(
    chunks.map((chunk: any, index: number) =>
      limiter.schedule(() => processChunk(chunk, index))
    )
  );

  return embeddings || [];
}

export const createThread = async (): Promise<Thread> => {
  const thread = await openai.beta.threads.create();
  return thread;
};

export const uploadFile = async (file: File): Promise<FileObject> => {
  const fileObject = await openai.files.create({
    file: file,
    purpose: 'assistants'
  });

  return fileObject;
};

export const deleteFile = async (fileIds: string[]): Promise<FileDeleted[]> => {
  const deletedFiles: FileDeleted[] = [];

  // Iterate over the fileIds and delete each file individually
  for (const fileId of fileIds) {
    const deletedFile = await openai.files.del(fileId);
    deletedFiles.push(deletedFile);
  }

  return deletedFiles;
};

export const getFiles = async (): Promise<FileObject[]> => {
  const files = await openai.files.list();

  return files.data;
};
