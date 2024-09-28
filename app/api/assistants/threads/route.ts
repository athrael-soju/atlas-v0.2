import { createThread } from '@/lib/service/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger

export async function POST() {
  try {
    logger.info('POST request received to create a new thread.');

    const thread = await createThread();

    if (!thread || !thread.id) {
      logger.error('Failed to create a thread. Thread object is invalid.');
      return new Response(
        JSON.stringify({ error: 'Failed to create thread' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logger.info(`Successfully created thread with ID: ${thread.id}`);
    return new Response(JSON.stringify({ threadId: thread.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error(`Error creating thread: ${error.message || 'Unknown error'}`);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create thread' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
