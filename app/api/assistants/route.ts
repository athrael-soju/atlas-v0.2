import { openai } from '@/lib/client/openai';
import {
  logInfo,
  logError,
  logSuccess,
  logTiming
} from '@/lib/service/logging';

// Create a new assistant
export async function POST() {
  const startTime = Date.now();
  logInfo('==================== START POST REQUEST ====================');
  logInfo('POST request received to create a new assistant');

  try {
    // Ensure the model is defined
    const model = process.env.OPENAI_API_MODEL as string;
    if (!model) {
      logError('Missing model configuration');
      logTiming('Missing model configuration validation', startTime);
      logInfo('==================== END POST REQUEST ======================');

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

    logSuccess('Assistant created successfully');
    logTiming('Complete POST request', startTime);
    logInfo('==================== END POST REQUEST ======================');

    return new Response(JSON.stringify({ assistantId: assistant.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logError(`Error occurred during POST request - ${error.message}`);
    logTiming('POST request handling', startTime);
    logInfo('==================== END POST REQUEST ======================');

    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
