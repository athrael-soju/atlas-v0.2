import { openai } from '@/lib/client/openai';
import { Assistant } from 'openai/resources/beta/assistants.mjs';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  logger.error(chalk.red('Missing OPENAI_ASSISTANT_ID environment variable'));
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

export async function PUT(request: Request) {
  try {
    logger.info(chalk.blue('PUT request received for updating assistant'));

    const formData = await request.formData();
    const userId = formData.get('userId') as string;

    if (!userId) {
      logger.warn(chalk.yellow('Missing or invalid userId in PUT request'));
      return new Response(
        JSON.stringify({ error: 'Invalid user or missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logger.info(
      chalk.blue(
        `Fetching assistant with ID: ${assistantId} for userId: ${userId}`
      )
    );

    // Fetch the current assistant
    const assistant: Assistant =
      await openai.beta.assistants.retrieve(assistantId);

    if (!assistant) {
      logger.error(chalk.red('Failed to retrieve the assistant'));
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve the assistant' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logger.info(
      chalk.green(`Successfully retrieved assistant with ID: ${assistantId}`)
    );

    // Update the assistant with the new instructions
    logger.info(
      chalk.blue(
        `Updating assistant instructions for assistant ID: ${assistantId}`
      )
    );

    const updatedAssistant: Assistant = await openai.beta.assistants.update(
      assistantId,
      {
        instructions:
          'You are a knowledgebase assistant with access to a vast library of documents. You can seek information from these documents to answer questions or provide explanations. If you are not able to find the information you are looking for within the documents, you can respond that you do not have the information. Keep your responses succinct and informative, but not overly verbose.',
        name: 'Knowledgebase',
        tools: [{ type: 'file_search' }],
        tool_resources: null // Adjust or remove if file IDs need to be provided
      }
    );

    if (!updatedAssistant) {
      logger.error(chalk.red('Failed to update assistant with new settings'));
      return new Response(
        JSON.stringify({
          error: 'Failed to update assistant with new settings'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logger.info(
      chalk.green(
        `Successfully updated assistant with ID: ${assistantId} for userId: ${userId}`
      )
    );

    return new Response(JSON.stringify({ assistant: updatedAssistant }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error(
      chalk.red(`PUT request failed: ${error.message || 'Unknown error'}`)
    );
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
