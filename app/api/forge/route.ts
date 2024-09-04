import { NextRequest, NextResponse } from 'next/server';
import { Embedding, ForgeSettings, ParsedElement } from '@/types/settings';
import { parseAndChunk } from '@/lib/service/unstructured';
import { UploadedFile } from '@/types/file-uploader';
import { embedDocument } from '@/lib/service/openai';
import { upsertDocument } from '@/lib/service/pinecone';
import { validateUser } from '@/lib/utils';

function sendUpdate(
  status: string,
  message: string,
  controller: ReadableStreamDefaultController
): void {
  const data = JSON.stringify({ status, message });
  controller.enqueue(`data: ${data}\n\n`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const fileIds = JSON.parse(formData.get('fileIds') as string);
    const userId = formData.get('userId') as string;

    // Validate user
    const userServerData = await validateUser(userId);

    // Validate file IDs
    validateFileIds(fileIds);

    const forgeSettings = userServerData.settings.forge as ForgeSettings;

    // Validate forge Settings
    validateForgeSettings(forgeSettings);

    // Retrieve file data
    const files = userServerData.knowledgebase.files.filter((file) =>
      fileIds.includes(file.key)
    );

    // Setup and return SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const send = (state: string, message: string) =>
          sendUpdate(state, message, controller);
        processFiles(userId, files, forgeSettings, send).then(() => {
          controller.close();
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    return handleErrorResponse(error);
  }
}

function validateFileIds(fileIds: any): void {
  if (!Array.isArray(fileIds)) {
    throw new Error('Invalid file IDs');
  }
}

function validateForgeSettings(forgeSettings: ForgeSettings): void {
  if (!forgeSettings?.chunkBatch ?? !forgeSettings?.chunkOverlap) {
    throw new Error('Invalid forge settings');
  }
}

async function processFiles(
  userId: string,
  files: UploadedFile[],
  forgeSettings: ForgeSettings,
  sendUpdate: (status: string, message: string) => void
) {
  for (const file of files) {
    try {
      sendUpdate('Processing', `${file.name}`);

      const chunks: ParsedElement[] = await parseAndChunk(forgeSettings, file);
      sendUpdate('Parsed', `${chunks.length} chunks`);

      const embeddings: Embedding[] = await embedDocument(userId, file, chunks);
      sendUpdate('Embedded', `${embeddings.length} chunks`);

      const upsertedCount = await upsertDocument(
        userId,
        embeddings,
        forgeSettings.chunkBatch
      );
      sendUpdate('Upserted', `${upsertedCount} chunks`);
    } catch (error: any) {
      sendUpdate('error', `Error processing '${file.name}': ${error.message}`);
    } finally {
      sendUpdate('done', `${file.name}`);
    }
  }
}

function handleErrorResponse(error: any): NextResponse {
  const status =
    error.message === 'Invalid user' || error.message === 'Invalid file IDs'
      ? 400
      : 500;
  return new NextResponse(
    JSON.stringify({ message: error.message || 'Internal server error' }),
    { status }
  );
}
