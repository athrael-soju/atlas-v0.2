import { UploadedFile } from '@/types/file-uploader';
import OpenAI, { ClientOptions } from 'openai';
import { toAscii } from '@/lib/utils';
import { ParsedElement } from '@/types/settings';
import { Thread } from 'openai/resources/beta/threads/threads.mjs';

const embeddingApiModel =
  process.env.OPENAI_API_EMBEDDING_MODEL || 'text-embedding-3-large';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

const options: ClientOptions = { apiKey: process.env.OPENAI_API_KEY };
const openai = new OpenAI(options);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  file: UploadedFile,
  chunks: ParsedElement[]
) {
  const chunkIdList: string[] = [];

  let chunkNumber = 0;
  const embeddings = await Promise.all(
    chunks.map(async (chunk: any) => {
      await delay(13); // Temporary fix for rate limiting 5000 RPM
      const response = await openai.embeddings.create({
        model: embeddingApiModel,
        input: chunk.text,
        encoding_format: 'float'
      });
      const transformedMetadata = transformObjectValues(chunk.metadata);

      const newId = `${toAscii(file.name)}#${file.key}#${++chunkNumber}`;
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
    })
  );

  return embeddings || [];
}

export const createThread = async (): Promise<Thread> => {
  const thread = await openai.beta.threads.create();
  return thread;
};
