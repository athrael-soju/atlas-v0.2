import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging
import { Message } from 'openai/resources/beta/threads/messages.mjs';

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

export async function POST(
  request: Request,
  { params: { threadId } }: { params: { threadId: string } }
) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START POST REQUEST ====================')
  );
  logger.info(
    chalk.blue(
      'POST request received for creating messages and initiating assistant response stream'
    )
  );

  let contextMessage: Message | null = null;
  const { userMessage, finalMessage } = await request.json();

  try {
    // Create the user's message in the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: userMessage
    });

    if (finalMessage !== '') {
      // Create the context message in the thread
      contextMessage = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: finalMessage
      });
    }

    // Initiate a stream for the assistant's response
    const assistantStream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId
    });

    // Create a new ReadableStream to send to the client
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = assistantStream.toReadableStream().getReader();
        try {
          let done: boolean;
          let value: Uint8Array;
          while (true) {
            ({ done, value } = await reader.read());
            if (done) break;
            // Enqueue the chunk to the client
            controller.enqueue(value);
          }
          // Close the stream when done
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          // After the stream ends, delete the contextMessage
          if (contextMessage !== null) {
            await openai.beta.threads.messages.del(
              contextMessage.thread_id,
              contextMessage.id
            );
          }
        }
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(
        `Assistant response stream started successfully - Request took ${duration}ms`
      )
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(
        `Error occurred during POST request - ${error.message} - Request took ${duration}ms`
      ),
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
