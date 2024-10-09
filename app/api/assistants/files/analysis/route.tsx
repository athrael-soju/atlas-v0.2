import { FileObject } from 'openai/resources/files.mjs';
import {
  addAssistantFiles,
  removeAssistantFiles,
  updateAssistantFileStatus
} from '@/lib/service/mongodb';
import { uploadFile, deleteFile, getFiles } from '@/lib/service/openai';
import { AssistantFile } from '@/types/data';
import { openai } from '@/lib/client/openai';
import { Assistant } from 'openai/resources/beta/assistants.mjs';
import { getLocalDateTime } from '@/lib/utils';
import { logger } from '@/lib/service/winston'; // Winston logger
import chalk from 'chalk'; // For colorized logging

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  logger.error(chalk.red('Missing OPENAI_ASSISTANT_ID environment variable'));
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

// Upload file to OpenAI and associate it with assistants
export async function POST(request: Request) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START POST REQUEST ====================')
  );
  logger.info(chalk.blue('POST request received for file upload'));

  try {
    const data = await request.formData();
    const userId = data.get('userId') as string;

    if (!userId || !data.has('files')) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Invalid user or files data in the request - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );
      throw new Error('Invalid user or files');
    }

    const files = data.getAll('files') as File[];
    const assistantFiles: AssistantFile[] = [];

    logger.info(
      chalk.blue(`Uploading ${files.length} files for userId: ${userId}`)
    );

    await Promise.all(
      files.map(async (file) => {
        try {
          if (!file) {
            logger.error(chalk.red('Invalid file object received'));
            throw new Error('Invalid file object');
          }
          logger.info(chalk.blue(`Uploading file: ${file.name}`));

          const fileObject: FileObject = await uploadFile(file);

          if (!fileObject) {
            logger.error(chalk.red('Failed to upload document to OpenAI'));
            throw new Error('Failed to upload document to OpenAI');
          }
          const date = new Date(fileObject.created_at * 1000);
          const assistantFile: AssistantFile = {
            id: fileObject.id,
            created_at: getLocalDateTime(date),
            bytes: fileObject.bytes,
            filename: fileObject.filename,
            isActive: false
          };

          assistantFiles.push(assistantFile);
          logger.info(
            chalk.green(`File uploaded successfully: ${fileObject.filename}`)
          );
        } catch (uploadError) {
          logger.error(chalk.red(`Error uploading file: ${uploadError}`));
          throw uploadError;
        }
      })
    );

    const response = await addAssistantFiles(userId, assistantFiles);

    if (response.modifiedCount === 0) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Failed to update assistant files in MongoDB - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );
      throw new Error('Failed to update assistant files in MongoDB');
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(
        `Successfully updated MongoDB with uploaded files for userId: ${userId} - Request took `
      ) + chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );

    return new Response(JSON.stringify({ response, assistantFiles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(`POST request failed: ${error.message} - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: Request) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START DELETE REQUEST ====================')
  );
  logger.info(chalk.blue('DELETE request received for file deletion'));

  try {
    const data = await request.json();
    const userId = data.userId as string;
    const files = data.files as AssistantFile[];

    if (!userId || !files) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Invalid user or file data in DELETE request - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END DELETE REQUEST ======================'
        )
      );
      throw new Error('Invalid user or file ID');
    }

    logger.info(chalk.blue(`Deleting files for userId: ${userId}`));
    const fileIds = files.map((file) => file.id);
    await removeAssistantFiles(userId, fileIds);
    const deletedFiles = await deleteFile(fileIds);

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(
        `Successfully deleted files for userId: ${userId} - Request took `
      ) + chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue(
        '==================== END DELETE REQUEST ======================'
      )
    );

    return new Response(JSON.stringify({ deletedFiles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(`DELETE request failed: ${error.message} - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue(
        '==================== END DELETE REQUEST ======================'
      )
    );
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START GET REQUEST ====================')
  );
  logger.info(chalk.blue('GET request received for fetching files'));

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Invalid user ID in GET request - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END GET REQUEST ======================'
        )
      );
      throw new Error('Invalid user ID');
    }

    const files: FileObject[] = await getFiles();

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(
        `Fetched ${files.length} files for userId: ${userId} - Request took `
      ) + chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );

    return new Response(JSON.stringify({ files }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(`GET request failed: ${error.message} - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START PUT REQUEST ====================')
  );
  logger.info(chalk.blue('PUT request received for updating assistant files'));

  try {
    const formData = await request.formData();
    const fileIds = JSON.parse(formData.get('fileIds') as string);
    const userId = formData.get('userId') as string;

    if (!userId || !fileIds) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Invalid user or fileIds in PUT request - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END PUT REQUEST ======================'
        )
      );
      throw new Error('Invalid user or fileIds');
    }

    logger.info(
      chalk.blue(
        `Fetching current assistant data for assistantId: ${assistantId}`
      )
    );
    const assistant: Assistant =
      await openai.beta.assistants.retrieve(assistantId);

    if (!assistant) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Failed to retrieve the assistant with ID: ${assistantId} - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END PUT REQUEST ======================'
        )
      );
      throw new Error('Failed to retrieve the assistant');
    }

    logger.info(
      chalk.blue(`Updating assistant with new fileIds for userId: ${userId}`)
    );
    const updatedAssistant: Assistant = await openai.beta.assistants.update(
      assistantId,
      {
        instructions:
          'You are an Analyst with access to powerful code interpreter and debugger tools. You may have access to files to assist you in your work.',
        name: 'Analyst',
        tools: [{ type: 'code_interpreter' }],
        tool_resources: { code_interpreter: { file_ids: fileIds } }
      }
    );

    if (!updatedAssistant) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Failed to update assistant with new fileIds - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END PUT REQUEST ======================'
        )
      );
      throw new Error('Failed to update assistant with new fileIds');
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(
        `Successfully updated assistant for userId: ${userId} - Request took `
      ) + chalk.magenta(`${duration} ms`)
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
      chalk.red(`PUT request failed: ${error.message} - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END PUT REQUEST ======================')
    );
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PATCH(request: Request) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START PATCH REQUEST ====================')
  );
  logger.info(
    chalk.blue('PATCH request received for toggling file isActive status')
  );

  try {
    const { userId, file } = await request.json();

    if (!userId || !file || !file.id) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Invalid userId, fileId, or isActive value in PATCH request - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END PATCH REQUEST ======================'
        )
      );
      throw new Error('Invalid userId, fileId, or isActive value');
    }

    logger.info(
      chalk.blue(
        `Toggling isActive status for fileId: ${file.id}, userId: ${userId}`
      )
    );

    const response = await updateAssistantFileStatus(userId, file);

    if (response.modifiedCount === 0) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Failed to update file status in MongoDB - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END PATCH REQUEST ======================'
        )
      );
      throw new Error('Failed to update file status in MongoDB');
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(
        `Successfully updated isActive status for fileId: ${file.id}, userId: ${userId} - Request took `
      ) + chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue(
        '==================== END PATCH REQUEST ======================'
      )
    );

    return new Response(
      JSON.stringify({ message: 'File status updated successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(`PATCH request failed: ${error.message} - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue(
        '==================== END PATCH REQUEST ======================'
      )
    );
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
