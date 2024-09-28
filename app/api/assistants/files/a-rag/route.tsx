import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Winston logger

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

// Upload file to assistant's vector store
export async function POST(request: Request) {
  try {
    logger.info('POST request received to upload a file to vector store');

    const formData = await request.formData(); // Process file as FormData
    const file = formData.get('file'); // Retrieve the single file from FormData

    if (!file) {
      logger.warn('No file provided in the request');
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const vectorStoreId = await getOrCreateVectorStore(); // Get or create vector store

    logger.info(`Uploading file to vector store with ID: ${vectorStoreId}`);

    // Upload using the file stream
    const openaiFile = await openai.files.create({
      file: file as File,
      purpose: 'assistants'
    });

    // Add file to vector store
    await openai.beta.vectorStores.files.create(vectorStoreId as string, {
      file_id: openaiFile.id
    });

    logger.info(
      `File uploaded and added to vector store with file ID: ${openaiFile.id}`
    );
    return new Response(JSON.stringify({ fileId: openaiFile.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error(
      `Error uploading file to vector store: ${
        error.message || 'Unknown error'
      }`
    );
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// List files in assistant's vector store
export async function GET() {
  try {
    logger.info('GET request received to list files in vector store');

    const vectorStoreId = await getOrCreateVectorStore(); // Get or create vector store
    const fileList = await openai.beta.vectorStores.files.list(
      vectorStoreId as string
    ); // List files in vector store

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

    logger.info(
      `Successfully retrieved ${filesArray.length} files from vector store`
    );
    return new Response(JSON.stringify(filesArray), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error(
      `Error retrieving files from vector store: ${
        error.message || 'Unknown error'
      }`
    );
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Delete file from assistant's vector store
export async function DELETE(request: Request) {
  try {
    logger.info('DELETE request received to remove a file from vector store');

    const body = await request.json();
    const fileId = body.fileId;

    if (!fileId) {
      logger.warn('No fileId provided in DELETE request');
      return new Response(JSON.stringify({ error: 'Missing fileId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const vectorStoreId = (await getOrCreateVectorStore()) as string; // Get or create vector store

    logger.info(
      `Deleting file with ID: ${fileId} from vector store with ID: ${vectorStoreId}`
    );

    await openai.beta.vectorStores.files.del(vectorStoreId, fileId); // Delete file from vector store

    logger.info(
      `Successfully deleted file with ID: ${fileId} from vector store`
    );
    return new Response(null, { status: 204 }); // No content response
  } catch (error: any) {
    logger.error(
      `Error deleting file from vector store: ${
        error.message || 'Unknown error'
      }`
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
      logger.info(
        `Vector store already exists for assistant with ID: ${assistantId}`
      );
      return (
        assistant.tool_resources?.file_search?.vector_store_ids?.[0] ?? null
      );
    }

    // Otherwise, create a new vector store and attach it to the assistant
    logger.info('Creating a new vector store for the assistant');
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

    logger.info(
      `Created and attached vector store with ID: ${vectorStore.id} to assistant`
    );
    return vectorStore.id;
  } catch (error: any) {
    logger.error(
      `Error creating or retrieving vector store: ${
        error.message || 'Unknown error'
      }`
    );
    throw new Error('Failed to create or retrieve vector store');
  }
};
