import { FileObject } from 'openai/resources/files.mjs';
import { updateAssistantFiles } from '@/lib/service/mongodb';
import { uploadFile } from '@/lib/service/openai';

export const runtime = 'nodejs';

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

// Upload file to OpenAI and associate it with assistants
export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const files = data.getAll('files') as File[];

    const assistantFiles: FileObject[] = [];

    console.log('Starting file uploads...');

    // Upload all files to OpenAI using Promise.all and await the result
    await Promise.all(
      files.map(async (file) => {
        try {
          // Log the file name or details
          console.log('Processing file:', file.name);

          // Check if the file is valid and log before uploading
          if (!file) {
            console.log('Invalid file object:', file);
            throw new Error('Invalid file object');
          }

          // Upload the file to OpenAI
          const fileObject = await uploadFile(file);

          console.log('File uploaded successfully:', fileObject);

          if (!fileObject) {
            throw new Error('Failed to upload document to OpenAI');
          }

          // Push the fileObject to the assistantFiles array
          assistantFiles.push(fileObject);
        } catch (uploadError) {
          console.error('Error during file upload:', uploadError);
          throw uploadError; // Re-throw to be caught in the outer try-catch block
        }
      })
    );

    console.log('All files uploaded successfully.');

    // Update assistant files in MongoDB
    const response = await updateAssistantFiles(
      '66eb3f179b6f30c13a292230',
      assistantFiles
    );

    // Return the response after all uploads are complete
    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    // Return error response if any upload fails
    console.error('Error in file upload process:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  // Implementation of GET if needed
}

export async function DELETE(request: Request) {
  // Implementation of DELETE if needed
}
