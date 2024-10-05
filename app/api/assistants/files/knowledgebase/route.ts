import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging
import { Assistant } from 'openai/resources/beta/assistants.mjs';

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

export async function PUT(request: Request) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START PUT REQUEST ====================')
  );
  logger.info(
    chalk.blue('PUT request received for updating assistant settings')
  );

  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;

    if (!userId) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Invalid user or missing userId - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END PUT REQUEST ======================'
        )
      );

      return new Response(
        JSON.stringify({ error: 'Invalid user or missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the current assistant
    const assistant: Assistant =
      await openai.beta.assistants.retrieve(assistantId);

    if (!assistant) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Failed to retrieve the assistant - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END PUT REQUEST ======================'
        )
      );

      return new Response(
        JSON.stringify({ error: 'Failed to retrieve the assistant' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the assistant with the new instructions
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
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Failed to update assistant with new settings - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END PUT REQUEST ======================'
        )
      );

      return new Response(
        JSON.stringify({
          error: 'Failed to update assistant with new settings'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`Assistant updated successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END PUT REQUEST ======================')
    );

    return new Response(JSON.stringify({ assistant: updatedAssistant }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(
        `Error occurred during PUT request - ${error.message} - Request took `
      ) + chalk.magenta(`${duration} ms`),
      {
        stack: error.stack
      }
    );
    logger.info(
      chalk.blue('==================== END PUT REQUEST ======================')
    );

    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
