import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/lib/service/mongodb';
import { IUser } from '@/models/User';
import { getFileUrls } from '@/lib/service/uploadthing';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { fileIds, userId } = await parseRequest(req);

    // Validate user
    const userServerData = await validateUser(userId);

    // Validate file IDs
    validateFileIds(fileIds);

    // Get file URLs and corresponding names
    const transformedFileData = await fetchFileData(fileIds);
    const fileNames = mapFileNames(userServerData);

    // Setup and return SSE stream
    const stream = createSSEStream([...transformedFileData], fileNames);

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

async function fetchFileData(fileIds: string[]) {
  const fileUrlList = await getFileUrls(fileIds);
  return fileUrlList.data;
}

function mapFileNames(userServerData: IUser): Record<string, string> {
  return userServerData.knowledgebase.files.reduce(
    (acc, file) => {
      acc[file.key] = file.name;
      return acc;
    },
    {} as Record<string, string>
  );
}

function createSSEStream(
  transformedFileData: any[],
  fileNames: Record<string, string>
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      processFiles(transformedFileData, fileNames, controller);
    }
  });
}

async function processFiles(
  transformedFileData: any[],
  fileNames: Record<string, string>,
  controller: ReadableStreamDefaultController
) {
  for (const fileData of transformedFileData) {
    try {
      const fileName = fileNames[fileData.key];
      const file = await fetchAndSaveFile(fileData.url, fileName);
      controller.enqueue(
        `data: {"status": "Processing File", "message": "${file.name}"}\n\n`
      );
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
