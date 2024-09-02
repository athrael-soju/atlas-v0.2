import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/lib/service/mongodb';
import { IUser } from '@/models/User';

export async function POST(req: NextRequest, res: NextResponse) {
  const formData = await req.formData(); // process file as FormData
  // retrieve the file array from FormData
  const fileIds = JSON.parse(formData.get('fileIds') as string);
  const userId = formData.get('userId') as string;

  // Get User Data Object from db
  const userServerData: IUser = await getUserData(userId);

  // Validate the user
  const userValidated = userServerData._id.toString() === userId;
  if (!userValidated) {
    return NextResponse.json({ message: 'Invalid user' }, { status: 400 });
  }
  // Validate the request body
  if (!Array.isArray(fileIds)) {
    return NextResponse.json(fileIds, { status: 400 });
  }

  // Process the array of IDs
  console.log(userServerData.knowledgebase.files);

  return NextResponse.json({ fileIds, status: 200 });
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
