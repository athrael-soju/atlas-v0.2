import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

// Create a new assistant
export async function POST() {
  try {
    logger.info(chalk.blue('POST request received to create a new assistant'));

    // Ensure the model is defined
    const model = process.env.OPENAI_API_MODEL as string;
    if (!model) {
      logger.error(chalk.red('Missing OPENAI_API_MODEL environment variable'));
      return new Response(
        JSON.stringify({ error: 'Missing model configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the assistant
    logger.info(chalk.blue(`Creating a new assistant with model: ${model}`));
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

    logger.info(
      chalk.green(`Assistant created successfully with ID: ${assistant.id}`)
    );

    return new Response(JSON.stringify({ assistantId: assistant.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error(
      chalk.red(`Error creating assistant: ${error.message || 'Unknown error'}`)
    );
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
