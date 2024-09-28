import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  logger.error('Missing OPENAI_ASSISTANT_ID environment variable');
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

export async function POST(
  request: Request,
  { params: { threadId } }: { params: { threadId: string } }
) {
  try {
    logger.info(`POST request received for thread ID: ${threadId}`);

    // Parse the request body
    const { text } = await request.json();

    if (!text) {
      logger.warn('Text is missing in the request body');
      return new Response(
        JSON.stringify({ error: 'Missing text in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    logger.info(`Received text: ${text}`);
    // Create a message in the thread
    logger.info(`Creating message for thread ID: ${threadId}`);
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: text
    });

    // Initiate a stream for the assistant's response
    logger.info(
      `Starting stream for thread ID: ${threadId} with assistant ID: ${assistantId}`
    );
    const stream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId
    });

    logger.info(`Successfully started stream for thread ID: ${threadId}`);
    return new Response(stream.toReadableStream());
  } catch (error: any) {
    logger.error(
      `Error in POST request for thread ID: ${threadId}: ${
        error.message || 'Unknown error'
      }`
    );
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
