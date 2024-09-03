import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/lib/service/mongodb';
import { IUser } from '@/models/User';
import { ForgeSettings } from '@/types/forge';
import { parseAndChunk } from '@/lib/service/unstructured';
import { UploadedFile } from '@/types/file-uploader';

function sendUpdate(
  status: string,
  controller: ReadableStreamDefaultController,
  message: string
): void {
  const data = JSON.stringify({ status, message });
  controller.enqueue(`data: ${data}\n\n`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { fileIds, userId } = await parseRequest(req);

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
        const send = (type: string, message: string) =>
          sendUpdate(type, controller, message);
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

async function parseRequest(req: NextRequest) {
  const formData = await req.formData();
  const fileIds = JSON.parse(formData.get('fileIds') as string);
  const userId = formData.get('userId') as string;
  return { fileIds, userId };
}

async function validateUser(userId: string): Promise<IUser> {
  const userServerData = await getUserData(userId);
  if (userServerData._id.toString() !== userId) {
    throw new Error('Invalid user');
  }
  return userServerData;
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
      sendUpdate('processing', `${file.name}`);
      const chunks = await parseAndChunk(forgeSettings, file);
      //await new Promise((resolve) => setTimeout(resolve, 1000));
      sendUpdate('processed', `${chunks.length} chunks`);
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

//try {
// Parse File
//   await parse(
//     config.parsingProvider,
//     config.minChunkSize,
//     config.maxChunkSize,
//     config.chunkOverlap,
//     config.chunkingStrategy,
//     config.partitioningStrategy,
//     atlasFile
//   )
// Embed Document
// await embedDocument(atlasFile, parseResponse, userEmail),
// Upsert Document
//  await upsertDocument(embedResponse.embeddings, userEmail, config.chunkBatch),
// Update user object to set files as processed
//   return { success: true, fileName: file.name };
// } catch (error: any) {
//   sendUpdate('error', `Error processing '${file.name}': ${error.message}`);
//   // Rollback changes
//   await deleteFromVectorDb(atlasFile!, userEmail);
//   await dbInstance.purgeArchive(userEmail, Purpose.Scribe, atlasFile!.id);
//   return { success: false, fileName: file.name, error: error.message };
// }
