import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging
import { Embedding, ForgeSettings, ParsedElement } from '@/types/settings';
import { parseAndChunk } from '@/lib/service/unstructured';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { embedDocument } from '@/lib/service/openai';
import { validateUser } from '@/lib/utils';
import { updateFileDateProcessed } from '@/lib/service/mongodb';
import { getVectorDbProvider } from '@/lib/service/vector-db/factory';

function sendUpdate(
  status: string,
  message: string,
  controller: ReadableStreamDefaultController
): void {
  const data = JSON.stringify({ status, message });
  controller.enqueue(`data: ${data}\n\n`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START POST REQUEST ====================')
  );
  logger.info(
    chalk.blue(
      'POST request received for processing files and embedding content'
    )
  );

  try {
    const formData = await req.formData();
    const fileIds = JSON.parse(formData.get('fileIds') as string);
    const userId = formData.get('userId') as string;

    if (!userId) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Invalid user - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );
      throw new Error('Invalid user');
    }

    // Validate user
    const userServerData = await validateUser(userId);

    // Validate file IDs
    validateFileIds(fileIds);

    const forgeSettings = userServerData.settings.forge as ForgeSettings;

    // Retrieve file data
    const files = userServerData.files.knowledgebase.filter(
      (file: KnowledgebaseFile) => fileIds.includes(file.key)
    );

    // Setup and return SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const send = (state: string, message: string) =>
          sendUpdate(state, message, controller);

        processFiles(userId, files, forgeSettings, send)
          .then(() => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            logger.info(
              chalk.green(`All files processed successfully - Request took `) +
                chalk.magenta(`${duration} ms`)
            );
            logger.info(
              chalk.blue(
                '==================== END POST REQUEST ======================'
              )
            );
            controller.close();
          })
          .catch((err) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            logger.error(
              chalk.red(
                `Error processing files - ${err.message} - Request took `
              ) + chalk.magenta(`${duration} ms`)
            );
            logger.info(
              chalk.blue(
                '==================== END POST REQUEST ======================'
              )
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
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(
        `Error occurred during POST request - ${error.message} - Request took `
      ) + chalk.magenta(`${duration} ms`),
      {
        stack: error.stack
      }
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );
    return handleErrorResponse(error);
  }
}

function validateFileIds(fileIds: any): void {
  if (!Array.isArray(fileIds)) {
    throw new Error('Invalid file IDs');
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
      const chunks: ParsedElement[] = await parseAndChunk(forgeSettings, file);
      sendUpdate('Processed', `File chunked into ${chunks.length} parts.`);
      sendUpdate('Embedding', `Embedding file: ${file.name}`);
      const embeddings: Embedding[] = await embedDocument(userId, file, chunks);
      sendUpdate('Embedded', `File embedded into ${embeddings.length} chunks.`);
      sendUpdate('Upserting', `Upserting file: ${file.name}`);
      const vectorDbProvider = await getVectorDbProvider(
        forgeSettings.vectorizationProvider
      );
      const upsertedChunkCount = await vectorDbProvider.upsertDocument(
        userId,
        embeddings
      );
      sendUpdate('Upserted', `Upserted ${upsertedChunkCount} chunks.`);
      await updateFileDateProcessed(userId, [file]);
    } catch (error: any) {
      sendUpdate(
        'Error',
        `Error processing file '${file.name}': ${error.message}`
      );
      logger.error(
        chalk.red(`Error processing file '${file.name}': ${error.message}`),
        {
          stack: error.stack
        }
      );
    }
  }
}

function handleErrorResponse(error: any): NextResponse {
  const status =
    error.message === 'Invalid user' || error.message === 'Invalid file IDs'
      ? 400
      : 500;

  return new NextResponse(
    JSON.stringify({ message: error.message || 'Internal server error' }),
    { status }
  );
}
