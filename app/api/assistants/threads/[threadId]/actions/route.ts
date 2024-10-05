import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

export async function POST(
  request: Request,
  { params: { threadId } }: { params: { threadId: string } }
) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START POST REQUEST ====================')
  );
  logger.info(chalk.blue('POST request received  for submitting tool outputs to thread'));

  try {
    // Parse request body
    const { toolCallOutputs, runId } = await request.json();

    // Validate inputs
    if (!toolCallOutputs || !runId) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Missing toolCallOutputs or runId in request body - Request took ${duration}ms`
        )
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );

      return new Response(
        JSON.stringify({
          error: 'Missing toolCallOutputs or runId in request body'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Submit the tool outputs and start the stream
    const stream = openai.beta.threads.runs.submitToolOutputsStream(
      threadId,
      runId,
      { tool_outputs: toolCallOutputs }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(
        `Tool outputs submitted successfully - Request took ${duration}ms`
      )
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );

    return new Response(stream.toReadableStream());
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
