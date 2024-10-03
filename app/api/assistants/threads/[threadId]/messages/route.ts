import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';
import { Message } from 'openai/resources/beta/threads/messages.mjs';

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  logger.error(chalk.red('Missing OPENAI_ASSISTANT_ID environment variable'));
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

export async function POST(
  request: Request,
  { params: { threadId } }: { params: { threadId: string } }
) {
  let contextMessage: Message | null = null;
  const { userMessage, finalMessage } = await request.json();
  try {
    logger.info(chalk.blue(`POST request received for thread ID: ${threadId}`));

    // Create the user's message in the thread
    logger.info(chalk.blue(`Creating user message for thread ID: ${threadId}`));
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: userMessage
    });
    logger.info(
      chalk.green(
        `Successfully created user message for thread ID: ${threadId}`
      )
    );

    if (finalMessage !== '') {
      // Create the context message in the thread
      logger.info(
        chalk.blue(`Creating user context message for thread ID: ${threadId}`)
      );
      contextMessage = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: finalMessage
      });
      logger.info(
        chalk.green(
          `Successfully created user context message for thread ID: ${threadId}`
        )
      );
    }

    // Initiate a stream for the assistant's response
    logger.info(
      chalk.blue(
        `Starting stream for thread ID: ${threadId} with assistant ID: ${assistantId}`
      )
    );
    const assistantStream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId
    });
    logger.info(
      chalk.green(`Successfully started stream for thread ID: ${threadId}`)
    );

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
          logger.error(
            chalk.red(
              `Error in stream for thread ID: ${threadId}: ${
                (err as Error).message
              }`
            )
          );
          controller.error(err);
        } finally {
          // After the stream ends, delete the contextMessage
          if (contextMessage !== null) {
            logger.info(chalk.blue('Optimizing assistant message list'));
            try {
              await openai.beta.threads.messages.del(
                contextMessage.thread_id,
                contextMessage.id
              );

              // const messages = await openai.beta.threads.messages.list(
              //   contextMessage.thread_id
              // );
              // logger.info(
              //   chalk.green(
              //     messages.data
              //       .map((message) => JSON.stringify(message.content))
              //       .join('\n')
              //   )
              // );

              logger.info(chalk.green('Optimization complete'));
            } catch (deleteError) {
              logger.error(
                chalk.red(
                  `Failed to delete context message: ${
                    (deleteError as Error).message
                  }`
                )
              );
            }
          }
          logger.info(chalk.blue('POST request processing complete'));
        }
      }
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  } catch (error: any) {
    logger.error(
      chalk.red(
        `Error in POST request for thread ID: ${threadId}: ${
          error.message || 'Unknown error'
        }`
      )
    );
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
