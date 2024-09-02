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

  console.log(userServerData.knowledgebase.files);
  // Process the array of IDs

  return NextResponse.json({ fileIds, status: 200 });
}

async function processDocument(userId: string, files: string[]) {
  /*  try {
      // Upload File
      const uploadResponse: FileActionResponse = await measurePerformance(
        () => handleFileUpload(file, userEmail, fsProvider),
        `Uploading to Scribe: '${file.name}'`,
        sendUpdate
      );
      atlasFile = uploadResponse.file;
  
      // Retrieve user configuration
      const user = await measurePerformance(
        () => dbInstance.getUser(userEmail as string),
        'Retrieving forge configuration from DB',
        sendUpdate
      );
  
      if (!user.configuration.forge) {
        throw new Error('Forge configuration not found');
      }
  
      const config = user.configuration.forge as ForgeParams;
  
      // Parse File
      const parseResponse = await measurePerformance(
        () =>
          parse(
            config.parsingProvider,
            config.minChunkSize,
            config.maxChunkSize,
            config.chunkOverlap,
            config.chunkingStrategy,
            config.partitioningStrategy,
            atlasFile
          ),
        `Parsing: '${file.name}'`,
        sendUpdate
      );
  
      // Embed Document
      const embedResponse = await measurePerformance(
        () => embedDocument(atlasFile, parseResponse, userEmail),
        `Embedding: '${file.name}'`,
        sendUpdate
      );
  
      // Upsert Document
      await measurePerformance(
        () =>
          upsertDocument(embedResponse.embeddings, userEmail, config.chunkBatch),
        `Upserting: '${file.name}'`,
        sendUpdate
      );
  
      // Update DB
      await measurePerformance(
        () => dbInstance.insertArchive(userEmail, Purpose.Scribe, atlasFile),
        `Updating DB: '${file.name}'`,
        sendUpdate
      );
  
      // Clean Up
      await measurePerformance(
        () => handleFileDeletion(atlasFile, userEmail),
        `Cleaning up: '${file.name}'`,
        sendUpdate
      );
  
      return { success: true, fileName: file.name };
    } catch (error: any) {
      sendUpdate('error', `Error processing '${file.name}': ${error.message}`);
  
      // Rollback changes
      await deleteFromVectorDb(atlasFile!, userEmail);
      await dbInstance.purgeArchive(userEmail, Purpose.Scribe, atlasFile!.id);
      await handleFileDeletion(atlasFile!, userEmail);
  
      return { success: false, fileName: file.name, error: error.message };
    }
      */
}
