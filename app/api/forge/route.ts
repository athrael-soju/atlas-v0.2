import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/lib/service/mongodb';
import { IUser } from '@/models/User';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const fileIds = JSON.parse(formData.get('fileIds') as string);
    const userId = formData.get('userId') as string;

    // Validate user
    const userServerData: IUser = await getUserData(userId);
    if (userServerData._id.toString() !== userId) {
      return new NextResponse(JSON.stringify({ message: 'Invalid user' }), {
        status: 400
      });
    }

    // Validate fileIds
    if (!Array.isArray(fileIds)) {
      return new NextResponse(JSON.stringify({ message: 'Invalid file IDs' }), {
        status: 400
      });
    }

    // Setup SSE within the same POST request
    const stream = new ReadableStream({
      start(controller) {
        async function processFiles() {
          for (const fileId of fileIds) {
            try {
              // Simulate processing (replace with actual processing logic)
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Send a progress update to the client
              controller.enqueue(
                `data: {"status": "Processing File", "message": "${fileId}"}\n\n`
              );
            } catch (error: any) {
              // Handle any errors and notify the client
              controller.enqueue(
                `data: {"status": "Error Processing File", "message": ${fileId}}\n\n`
              );
            }
          }

          // When done, close the stream
          controller.close();
        }

        processFiles();
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
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      {
        status: 500
      }
    );
  }
}

async function processFiles(userId: string, files: string[]) {
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
}
