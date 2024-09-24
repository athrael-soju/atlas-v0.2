import { FileObject } from 'openai/resources/files.mjs';
import {
  updateAssistantFiles,
  deleteAssistantFiles
} from '@/lib/service/mongodb';
import { uploadFile, deleteFile, getFiles } from '@/lib/service/openai';
import { AssistantFile } from '@/types/data';
import { openai } from '@/lib/client/openai';
import { Assistant } from 'openai/resources/beta/assistants.mjs';

export const runtime = 'nodejs';

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

// Upload file to OpenAI and associate it with assistants
export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const userId = data.get('userId') as string;

    if (!userId || !data.has('files')) {
      throw new Error('Invalid user or files');
    }

    const files = data.getAll('files') as File[];
    const assistantFiles: AssistantFile[] = [];

    // Upload all files to OpenAI using Promise.all and await the result
    await Promise.all(
      files.map(async (file) => {
        try {
          // Check if the file is valid and log before uploading
          if (!file) {
            throw new Error('Invalid file object');
          }
          // Upload the file to OpenAI
          const fileObject: FileObject = await uploadFile(file);

          if (!fileObject) {
            throw new Error('Failed to upload document to OpenAI');
          }

          const assistantFile: AssistantFile = {
            id: fileObject.id,
            created_at: fileObject.created_at,
            bytes: fileObject.bytes,
            filename: fileObject.filename,
            isActive: false
          };

          // Push the fileObject to the assistantFiles array
          assistantFiles.push(assistantFile);
        } catch (uploadError) {
          throw uploadError; // Re-throw to be caught in the outer try-catch block
        }
      })
    );

    // Update assistant files in MongoDB
    const response = await updateAssistantFiles(userId, assistantFiles);

    if (response.modifiedCount === 0) {
      throw new Error('Failed to update assistant files in MongoDB');
    }

    // Return the response after all uploads are complete
    return new Response(JSON.stringify({ response, assistantFiles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    // Return error response if any upload fails
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const userId = data.userId as string;
    const files = data.files as AssistantFile[];

    if (!userId || !files) {
      throw new Error('Invalid user or file ID');
    }

    // Delete file from MongoDB
    const fileIds = await deleteAssistantFiles(userId, files);

    // Delete files from OpenAI
    const deletedFiles = await deleteFile(fileIds);

    // Return the response after all deletions are complete
    return new Response(JSON.stringify({ deletedFiles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    // Return error response if any deletion fails
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: Request) {
  try {
    const data = await request.json();
    const userId = data.userId as string;

    if (!userId) {
      throw new Error('Invalid user ID');
    }

    const files: FileObject[] = await getFiles();

    return new Response(JSON.stringify({ files }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    // Return error response if any upload fails
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request) {
  const formData = await request.formData();
  const fileIds = JSON.parse(formData.get('fileIds') as string);
  const userId = formData.get('userId') as string;

  if (!userId || !fileIds) {
    throw new Error('Invalid user or filIds');
  }

  // Fetch the current assistant
  const assistant: Assistant =
    await openai.beta.assistants.retrieve(assistantId);

  if (!assistant) {
    throw new Error('Failed to retrieve the assistant');
  }

  // Update the assistant with the new fileIds list
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
    throw new Error('Failed to update assistant with new fileIds');
  }

  return new Response(JSON.stringify({ assistant: updatedAssistant }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
