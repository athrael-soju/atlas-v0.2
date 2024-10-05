import { createThread } from '@/lib/service/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

export async function POST() {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START POST REQUEST ====================')
  );
  logger.info(chalk.blue('POST request received  for creating a new thread'));

  try {
    const thread = await createThread();

    if (!thread || !thread.id) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Failed to create thread - Request took ${duration}ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );

      return new Response(
        JSON.stringify({ error: 'Failed to create thread' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`Thread created successfully - Request took ${duration}ms`)
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );

    return new Response(JSON.stringify({ threadId: thread.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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
      JSON.stringify({ error: error.message || 'Failed to create thread' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
