import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

// Create a new assistant
export async function POST() {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START POST REQUEST ====================')
  );
  logger.info(chalk.blue('POST request received to create a new assistant'));

  try {
    // Ensure the model is defined
    const model = process.env.OPENAI_API_MODEL as string;
    if (!model) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Missing model configuration - Request took ${duration}ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );

      return new Response(
        JSON.stringify({ error: 'Missing model configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the assistant
    const assistant = await openai.beta.assistants.create({
      instructions: 'You are a helpful assistant.',
      name: 'Quickstart Assistant',
      model: model,
      tools: [
        { type: 'code_interpreter' },
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Determine weather in my location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state e.g. San Francisco, CA'
                },
                unit: {
                  type: 'string',
                  enum: ['c', 'f']
                }
              },
              required: ['location']
            }
          }
        },
        { type: 'file_search' }
      ]
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`Assistant created successfully - Request took ${duration}ms`)
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );

    return new Response(JSON.stringify({ assistantId: assistant.id }), {
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
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
