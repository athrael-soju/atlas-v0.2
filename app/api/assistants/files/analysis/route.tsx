import { openai } from '@/lib/client/openai';
import { FileObject } from 'openai/resources/files.mjs';
import client from '@/lib/client/mongodb';
const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

// upload file to OpenAI and associate it with assistants
export async function POST(request: Request) {
  const data = await request.formData();
  const files = data.getAll('files') as File[];
  const assistantFiles: FileObject[] = [];
  Promise.all(
    files.map(async (file) => {
      const fileObject = await openai.files.create({
        file: file,
        purpose: 'assistants'
      });
      if (!fileObject) {
        throw new Error('Failed to upload document to OpenAI');
      }
      assistantFiles.push(fileObject);
    })
  )
    .then(() => {
      return Response.json({ files: assistantFiles });
    })
    .catch((error) => {
      return Response.json({ error: error.message }, { status: 500 });
    });

  return Response.json({ files: assistantFiles });
}

export async function GET() {}

export async function DELETE(request: Request) {}
