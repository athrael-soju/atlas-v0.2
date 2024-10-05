import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

// Upload file to assistant's vector store
export async function POST(request: Request) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START POST REQUEST ====================')
  );
  logger.info(
    chalk('POST request received for uploading file to vector store')
  );

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`No file provided - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );

      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const vectorStoreId = await getOrCreateVectorStore();
    const openaiFile = await openai.files.create({
      file: file as File,
      purpose: 'assistants'
    });

    await openai.beta.vectorStores.files.create(vectorStoreId as string, {
      file_id: openaiFile.id
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`File uploaded successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );

    return new Response(JSON.stringify({ fileId: openaiFile.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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

    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// List files in assistant's vector store
export async function GET() {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START GET REQUEST ====================')
  );
  logger.info(
    chalk.blue('GET request received for listing files in vector store')
  );

  try {
    const vectorStoreId = await getOrCreateVectorStore();
    const fileList = await openai.beta.vectorStores.files.list(
      vectorStoreId as string
    );

    const filesArray = await Promise.all(
      fileList.data.map(async (file) => {
        const fileDetails = await openai.files.retrieve(file.id);
        const vectorFileDetails = await openai.beta.vectorStores.files.retrieve(
          vectorStoreId as string,
          file.id
        );
        return {
          file_id: file.id,
          filename: fileDetails.filename,
          status: vectorFileDetails.status
        };
      })
    );

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`Files listed successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );

    return new Response(JSON.stringify(filesArray), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(
        `Error occurred during GET request - ${error.message} - Request took `
      ) + chalk.magenta(`${duration} ms`),
      {
        stack: error.stack
      }
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );

    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Delete file from assistant's vector store
export async function DELETE(request: Request) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START DELETE REQUEST ====================')
  );
  logger.info(
    chalk.blue('DELETE request received for deleting file from vector store')
  );

  try {
    const body = await request.json();
    const fileId = body.fileId;

    if (!fileId) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Missing fileId - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END DELETE REQUEST ======================'
        )
      );

      return new Response(JSON.stringify({ error: 'Missing fileId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const vectorStoreId = (await getOrCreateVectorStore()) as string;
    await openai.beta.vectorStores.files.del(vectorStoreId, fileId);

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`File deleted successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue(
        '==================== END DELETE REQUEST ======================'
      )
    );

    return new Response(null, { status: 204 });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(
        `Error occurred during DELETE request - ${error.message} - Request took `
      ) + chalk.magenta(`${duration} ms`),
      {
        stack: error.stack
      }
    );
    logger.info(
      chalk.blue(
        '==================== END DELETE REQUEST ======================'
      )
    );

    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/* Helper functions */

const getOrCreateVectorStore = async () => {
  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);

    // If the assistant already has a vector store, return it
    if (
      (assistant.tool_resources?.file_search?.vector_store_ids?.length ?? 0) > 0
    ) {
      return (
        assistant.tool_resources?.file_search?.vector_store_ids?.[0] ?? null
      );
    }

    // Otherwise, create a new vector store and attach it to the assistant
    const vectorStore = await openai.beta.vectorStores.create({
      name: 'sample-assistant-vector-store'
    });

    // Update assistant to include the new vector store
    await openai.beta.assistants.update(assistantId, {
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });

    return vectorStore.id;
  } catch (error: any) {
    throw new Error('Failed to create or retrieve vector store');
  }
};
