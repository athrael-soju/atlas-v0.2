import { NextRequest, NextResponse } from 'next/server';
import { Embedding, ForgeSettings, ParsedElement } from '@/types/settings';
import { parseAndChunk } from '@/lib/service/unstructured';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { embedDocument } from '@/lib/service/openai';
import { upsertDocument } from '@/lib/service/pinecone';
import { validateUser } from '@/lib/utils';
import { updateFileDateProcessed } from '@/lib/service/mongodb';
import { logger } from '@/lib/service/winston'; // Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

function sendUpdate(
  status: string,
  message: string,
  controller: ReadableStreamDefaultController
): void {
  const data = JSON.stringify({ status, message });
  controller.enqueue(`data: ${data}\n\n`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    logger.info(chalk.blue('POST request received for file processing.'));

    const formData = await req.formData();
    const fileIds = JSON.parse(formData.get('fileIds') as string);
    const userId = formData.get('userId') as string;

    if (!userId) {
      logger.warn(chalk.yellow('Invalid user ID in request.'));
      throw new Error('Invalid user');
    }

    // Validate user
    const userServerData = await validateUser(userId);
    logger.info(chalk.green(`User validated successfully: ${userId}`));

    // Validate file IDs
    validateFileIds(fileIds);
    logger.info(chalk.blue(`File IDs validated: ${fileIds.join(', ')}`));

    const forgeSettings = userServerData.settings.forge as ForgeSettings;

    // Validate forge settings
    validateForgeSettings(forgeSettings);
    logger.info(chalk.blue('Forge settings validated.'));

    // Retrieve file data
    const files = userServerData.files.knowledgebase.filter(
      (file: KnowledgebaseFile) => fileIds.includes(file.key)
    );
    logger.info(chalk.blue(`Retrieved ${files.length} files for processing.`));

    // Setup and return SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const send = (state: string, message: string) =>
          sendUpdate(state, message, controller);

        processFiles(userId, files, forgeSettings, send)
          .then(() => controller.close())
          .catch((err) => {
            logger.error(
              chalk.red(`Error in processing files: ${err.message}`)
            );
            controller.error(err);
          });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    logger.error(chalk.red(`Error handling POST request: ${error}`));
    return handleErrorResponse(error);
  }
}

function validateFileIds(fileIds: any): void {
  if (!Array.isArray(fileIds)) {
    logger.warn(chalk.yellow('Invalid file IDs provided.'));
    throw new Error('Invalid file IDs');
  }
}

function validateForgeSettings(forgeSettings: ForgeSettings): void {
  if (forgeSettings?.chunkOverlap == null) {
    logger.warn(chalk.yellow('Invalid forge settings detected.'));
    throw new Error('Invalid forge settings');
  }
}

async function processFiles(
  userId: string,
  files: KnowledgebaseFile[],
  forgeSettings: ForgeSettings,
  sendUpdate: (status: string, message: string) => void
) {
  for (const file of files) {
    try {
      sendUpdate('Processing', `Processing file: ${file.name}`);
      logger.info(chalk.blue(`Processing file: ${file.name}`));

      const chunks: ParsedElement[] = await parseAndChunk(forgeSettings, file);
      sendUpdate('Processed', `File chunked into ${chunks.length} parts.`);
      logger.info(chalk.blue(`File chunked into ${chunks.length} parts.`));

      sendUpdate('Embedding', `Embedding file: ${file.name}`);
      const embeddings: Embedding[] = await embedDocument(userId, file, chunks);
      sendUpdate('Embedded', `File embedded into ${embeddings.length} chunks.`);
      logger.info(
        chalk.blue(`File embedded into ${embeddings.length} chunks.`)
      );

      sendUpdate('Upserting', `Upserting file: ${file.name}`);
      const upsertedChunkCount = await upsertDocument(userId, embeddings);
      sendUpdate('Upserted', `Upserted ${upsertedChunkCount} chunks.`);
      logger.info(
        chalk.green(
          `Upserted ${upsertedChunkCount} chunks for file: ${file.name}`
        )
      );

      await updateFileDateProcessed(userId, [file]);
      logger.info(chalk.green(`File processing complete: ${file.name}`));
    } catch (error: any) {
      sendUpdate('Error', `Error processing file '${file.name}': ${error}`);
      logger.error(chalk.red(`Error processing file '${file.name}': ${error}`));
    } finally {
      sendUpdate('Done', `Finished processing file: ${file.name}`);
    }
  }
}

function handleErrorResponse(error: any): NextResponse {
  const status =
    error.message === 'Invalid user' || error.message === 'Invalid file IDs'
      ? 400
      : 500;

  logger.error(chalk.red(`Error response: ${error}`));

  return new NextResponse(
    JSON.stringify({ message: error || 'Internal server error' }),
    { status }
  );
}
