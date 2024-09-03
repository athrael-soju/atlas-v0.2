import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/lib/service/mongodb';
import { IUser } from '@/models/User';
import { getFileUrls } from '@/lib/service/uploadthing';
import { ForgeSettings } from '@/types/forge';
import { parseAndChunk } from '@/lib/service/unstructured';
import { UploadedFile } from '@/types/file-uploader';

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
    const files = userServerData.knowledgebase.files;
    // Get file URLs and corresponding names

    // Setup and return SSE stream
    const stream = createSSEStream(userId, files, forgeSettings);

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

async function fetchFileData(fileIds: string[]) {
  const fileUrlList = await getFileUrls(fileIds);
  return fileUrlList.data;
}

function createSSEStream(
  userId: string,
  files: UploadedFile[],
  forgeSettings: ForgeSettings
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      processFiles(userId, files, forgeSettings, controller);
    }
  });
}

async function processFiles(
  userId: string,
  files: UploadedFile[],
  forgeSettings: ForgeSettings,
  controller: ReadableStreamDefaultController
) {
  //console.log('fileData', files);
  for (const file of files) {
    try {
      //const fileName = fileData[file];
      controller.enqueue(
        `data: {"status": "Processing File", "message": "${file.name}"}\n\n`
      );
      // console.log('file', file.name);
      // const stuff = await parseAndChunk(userId, forgeSettings, file);
      // console.log('stuff', stuff);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      controller.enqueue(
        `data: {"status": "Error Processing File", "message": "${error.message}"}\n\n`
      );
    }
  }
  controller.close();
}

async function fetchAndSaveFile(url: string, fileName: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch the file from the URL');
  }
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
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
