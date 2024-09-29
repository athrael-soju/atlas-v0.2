import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

export async function POST(
  request: Request,
  { params: { threadId } }: { params: { threadId: string } }
) {
  try {
    logger.info(chalk.blue(`POST request received for thread ID: ${threadId}`));

    // Parse request body
    const { toolCallOutputs, runId } = await request.json();

    // Validate inputs
    if (!toolCallOutputs || !runId) {
      logger.warn(
        chalk.yellow('Missing toolCallOutputs or runId in the request body')
      );
      return new Response(
        JSON.stringify({
          error: 'Missing toolCallOutputs or runId in request body'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log the details of toolCallOutputs and runId
    logger.info(
      chalk.blue(
        `Submitting tool outputs for run ID: ${runId} in thread ID: ${threadId}`
      )
    );

    // Submit the tool outputs and start the stream
    const stream = openai.beta.threads.runs.submitToolOutputsStream(
      threadId,
      runId,
      { tool_outputs: toolCallOutputs }
    );

    logger.info(
      chalk.green(`Stream started successfully for thread ID: ${threadId}`)
    );
    return new Response(stream.toReadableStream());
  } catch (error: any) {
    logger.error(
      chalk.red(
        `Error in submitting tool outputs for thread ID: ${threadId}: ${
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
