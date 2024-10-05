import { KnowledgebaseFile } from '@/types/file-uploader';
import OpenAI, { ClientOptions } from 'openai';
import { toAscii } from '@/lib/utils';
import { ParsedElement } from '@/types/settings';
import { Thread } from 'openai/resources/beta/threads/threads.mjs';
import { FileDeleted, FileObject } from 'openai/resources/index.mjs';
import Bottleneck from 'bottleneck';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import pRetry from 'p-retry';
import cliProgress from 'cli-progress';

const embeddingApiModel =
  process.env.OPENAI_API_EMBEDDING_MODEL || 'text-embedding-3-large';

if (!process.env.OPENAI_API_KEY) {
  throw new Error(chalk.red('OPENAI_API_KEY is not set'));
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
  const start = Date.now();
  try {
    logger.info(chalk.blue(`Embedding message for user: ${userId}`));

    const messageToEmbed = `Date: ${new Date().toLocaleString()}. User: ${userId}. Message: ${content}. Metadata: ${''}`;

    const response = await openai.embeddings.create({
      model: embeddingApiModel,
      input: messageToEmbed,
      encoding_format: 'float'
    });

    const embeddingValues = response.data[0].embedding;

    logger.info(
      chalk.green(
        `Successfully generated embeddings for message by user: ${userId}`
      )
    );

    return {
      id: uuidv4(),
      values: embeddingValues
    };
  } catch (error: any) {
    logger.error(
      chalk.red(
        `Failed to embed message for user: ${userId}. Error: ${error.message}`
      )
    );
    throw error;
  } finally {
    const duration = Date.now() - start;
    logger.info(
      chalk.green(`Embedding message for user: ${userId} took `) +
        chalk.magenta(`${duration} ms`)
    );
  }
}

export async function embedDocument(
  userId: string,
  file: KnowledgebaseFile,
  chunks: ParsedElement[]
) {
  const start = Date.now();
  const chunkIdList: string[] = [];

  // Initialize Bottleneck limiter for 5000 RPM (minTime: 12 ms)
  const limiter = new Bottleneck({
    reservoir: 5000, // Maximum number of requests per minute
    reservoirRefreshAmount: 5000,
    reservoirRefreshInterval: 60 * 1000, // 60 seconds
    minTime: 12 // Minimum time between requests (in ms) to allow up to 5000 RPM (~83 RPS)
  });

  // Initialize Progress Bar
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(chunks.length, 0);

  try {
    logger.info(
      chalk.blue(`Starting embedding process for document: ${file.name}`)
    );

    // Process all chunks using Bottleneck rate limiting
    const embeddings = await Promise.all(
      chunks.map(async (chunk, index) => {
        return limiter.schedule(async () => {
          try {
            // Request the embedding from OpenAI API
            const response = await openai.embeddings.create({
              model: embeddingApiModel,
              input: chunk.text,
              encoding_format: 'float'
            });

            // Create metadata for the chunk
            const transformedMetadata = transformObjectValues(chunk.metadata);
            const newId = `${toAscii(file.name)}#${file.key}#${index + 1}`;
            chunkIdList.push(newId);
            const embeddingValues = response.data[0].embedding;

            // Add citation field to the metadata
            const pageInfo = chunk.metadata.page_number
              ? `, Page ${chunk.metadata.page_number}`
              : '';
            const citation = `[${file.name}${pageInfo}](${file.url})`;
            const metadata = {
              ...transformedMetadata,
              text: chunk.text,
              userId: userId,
              url: file.url,
              citation: citation
            };

            // Increment the progress bar
            progressBar.increment(1);

            return {
              id: newId,
              values: embeddingValues,
              metadata: metadata
            };
          } catch (error: any) {
            logger.error(
              chalk.red(
                `Failed to embed chunk ${index + 1} for file: ${
                  file.name
                }. Error: ${error.message}`
              )
            );
            throw error;
          }
        });
      })
    );

    logger.info(
      chalk.green(`Successfully embedded all chunks for document: ${file.name}`)
    );
    return embeddings || [];
  } catch (error: any) {
    logger.error(
      chalk.red(
        `Failed to embed document: ${file.name}. Error: ${error.message}`
      )
    );
    throw error;
  } finally {
    const duration = Date.now() - start;
    logger.info(
      chalk.green(`Embedding document for file: ${file.name} took `) +
        chalk.magenta(`${duration} ms`)
    );
    progressBar.update(100);
    progressBar.stop();
  }
}

export const createThread = async (): Promise<Thread> => {
  const start = Date.now();
  try {
    logger.info(chalk.blue('Creating a new thread'));
    const thread = await openai.beta.threads.create();
    logger.info(chalk.green('Thread created successfully'));
    return thread;
  } catch (error: any) {
    logger.error(chalk.red(`Failed to create thread. Error: ${error.message}`));
    throw error;
  } finally {
    const duration = Date.now() - start;
    logger.info(
      chalk.green(`Creating thread took `) + chalk.magenta(`${duration} ms`)
    );
  }
};

export const uploadFile = async (file: File): Promise<FileObject> => {
  const start = Date.now();
  try {
    logger.info(chalk.blue(`Uploading file: ${file.name}`));
    const fileObject = await openai.files.create({
      file: file,
      purpose: 'assistants'
    });
    logger.info(chalk.green(`File uploaded successfully: ${file.name}`));
    return fileObject;
  } catch (error: any) {
    logger.error(
      chalk.red(`Failed to upload file: ${file.name}. Error: ${error.message}`)
    );
    throw error;
  } finally {
    const duration = Date.now() - start;
    logger.info(
      chalk.green(`Uploading file: ${file.name} took `) +
        chalk.magenta(`${duration} ms`)
    );
  }
};

export const deleteFile = async (fileIds: string[]): Promise<FileDeleted[]> => {
  const start = Date.now();
  const deletedFiles: FileDeleted[] = [];
  try {
    logger.info(
      chalk.blue(
        `Starting file deletion process for file IDs: ${fileIds.join(', ')}`
      )
    );

    // Iterate over the fileIds and delete each file individually
    for (const fileId of fileIds) {
      const fileStart = Date.now();
      logger.info(chalk.blue(`Deleting file with ID: ${fileId}`));
      const deletedFile = await openai.files.del(fileId);
      deletedFiles.push(deletedFile);
      const fileDuration = Date.now() - fileStart;
      logger.info(
        chalk.green(`Deleting file with ID: ${fileId} took `) +
          chalk.magenta(`${fileDuration} ms`)
      );
      logger.info(chalk.green(`Successfully deleted file with ID: ${fileId}`));
    }

    logger.info(
      chalk.green(
        `File deletion process completed for file IDs: ${fileIds.join(', ')}`
      )
    );
    return deletedFiles;
  } catch (error: any) {
    logger.error(chalk.red(`Failed to delete files. Error: ${error.message}`));
    throw error;
  } finally {
    const duration = Date.now() - start;
    logger.info(
      chalk.green(`File deletion process took `) +
        chalk.magenta(`${duration} ms`)
    );
  }
};

export const getFiles = async (): Promise<FileObject[]> => {
  const start = Date.now();
  try {
    logger.info(chalk.blue('Fetching list of files'));
    const files = await openai.files.list();
    logger.info(chalk.green(`Successfully fetched ${files.data.length} files`));
    return files.data;
  } catch (error: any) {
    logger.error(chalk.red(`Failed to fetch files. Error: ${error.message}`));
    throw error;
  } finally {
    const duration = Date.now() - start;
    logger.info(
      chalk.green(`Fetching list of files took `) +
        chalk.magenta(`${duration} ms`)
    );
  }
};
