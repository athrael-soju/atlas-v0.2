import { FileObject } from 'openai/resources/files.mjs';
import {
  updateAssistantFiles,
  deleteAssistantFiles
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
  logger.info(chalk.blue('POST request received for file upload'));
  try {
    const data = await request.formData();
    const userId = data.get('userId') as string;

    if (!userId || !data.has('files')) {
      logger.error(chalk.red('Invalid user or files data in the request'));
      throw new Error('Invalid user or files');
    }

    const files = data.getAll('files') as File[];
    const assistantFiles: AssistantFile[] = [];

    logger.info(
      chalk.blue(`Uploading ${files.length} files for userId: ${userId}`)
    );

    // Upload all files to OpenAI using Promise.all and await the result
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

    const response = await updateAssistantFiles(userId, assistantFiles);

    if (response.modifiedCount === 0) {
      logger.error(chalk.red('Failed to update assistant files in MongoDB'));
      throw new Error('Failed to update assistant files in MongoDB');
    }

    logger.info(
      chalk.green(
        `Successfully updated MongoDB with uploaded files for userId: ${userId}`
      )
    );

    return new Response(JSON.stringify({ response, assistantFiles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error(chalk.red(`POST request failed: ${error.message}`));
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: Request) {
  logger.info(chalk.blue('DELETE request received for file deletion'));
  try {
    const data = await request.json();
    const userId = data.userId as string;
    const files = data.files as AssistantFile[];

    if (!userId || !files) {
      logger.error(chalk.red('Invalid user or file data in DELETE request'));
      throw new Error('Invalid user or file ID');
    }

    logger.info(chalk.blue(`Deleting files for userId: ${userId}`));

    const fileIds = await deleteAssistantFiles(userId, files);
    const deletedFiles = await deleteFile(fileIds);

    logger.info(
      chalk.green(`Successfully deleted files for userId: ${userId}`)
    );

    return new Response(JSON.stringify({ deletedFiles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error(chalk.red(`DELETE request failed: ${error.message}`));
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: Request) {
  logger.info(chalk.blue('GET request received for fetching files'));
  try {
    const data = await request.json();
    const userId = data.userId as string;

    if (!userId) {
      logger.error(chalk.red('Invalid user ID in GET request'));
      throw new Error('Invalid user ID');
    }

    const files: FileObject[] = await getFiles();

    logger.info(
      chalk.green(`Fetched ${files.length} files for userId: ${userId}`)
    );

    return new Response(JSON.stringify({ files }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error(chalk.red(`GET request failed: ${error.message}`));
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request) {
  logger.info(chalk.blue('PUT request received for updating assistant files'));
  const formData = await request.formData();
  const fileIds = JSON.parse(formData.get('fileIds') as string);
  const userId = formData.get('userId') as string;

  if (!userId || !fileIds) {
    logger.error(chalk.red('Invalid user or fileIds in PUT request'));
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
    logger.error(
      chalk.red(`Failed to retrieve the assistant with ID: ${assistantId}`)
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
    logger.error(chalk.red('Failed to update assistant with new fileIds'));
    throw new Error('Failed to update assistant with new fileIds');
  }

  logger.info(
    chalk.green(`Successfully updated assistant for userId: ${userId}`)
  );

  return new Response(JSON.stringify({ assistant: updatedAssistant }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
