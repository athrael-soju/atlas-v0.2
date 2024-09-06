import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UTApi } from 'uploadthing/server';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';
import { getUserId } from '@/lib/service/mongodb';
const utapi = new UTApi();
import { deleteFromVectorDb } from './pinecone';
import { UploadedFile } from '@/types/file-uploader';
import { updateUserFiles } from '@/lib/service/mongodb';

const f = createUploadthing();

// Function to handle the upload completion logic
const handleUploadComplete = async ({
  metadata,
  file
}: {
  metadata: any;
  file: any;
}) => {
  const uploadedFile = {
    name: file.name,
    url: file.url,
    size: file.size,
    key: file.key,
    dateUploaded: new Date().toISOString(),
    dateProcessed: null
  };
  await updateUserFiles(metadata.userId, uploadedFile);
};

// Define file router rules
const defineFileRouter = (config: any) =>
  f(config)
    .middleware(async () => ({ userId: await getUserId() }))
    .onUploadComplete(handleUploadComplete);

// FileRouter implementation
export const ourFileRouter = {
  attachment: defineFileRouter({
    text: { maxFileCount: 5, maxFileSize: '5MB' },
    image: { maxFileCount: 5, maxFileSize: '10MB' },
    video: { maxFileCount: 1, maxFileSize: '100MB' },
    audio: { maxFileCount: 5, maxFileSize: '10MB' },
    pdf: { maxFileCount: 5, maxFileSize: '10MB' }
  })
} satisfies FileRouter;

// TODO: Implement multiple file deletion
export const deleteFiles = async (userId: string, files: UploadedFile[]) => {
  let deletedFileCount = 0;
  const id = userId;

  for (const file of files) {
    if (file.dateProcessed) {
      const deletedChunksCount = await deleteFromVectorDb(id, file);

      if (!deletedChunksCount) {
        throw new Error(`Failed to delete file chunks vector db: ${file.key}`);
      }
    }
    const filesArray = files.map((file) => file.key);
    const response = await utapi.deleteFiles(file.key);
    if (!response.success || response.deletedCount < 1) {
      throw new Error(`Failed to delete file: ${file.key}`);
    }

    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $pull: { 'knowledgebase.files': { key: { $in: filesArray } } as any },
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    if (result.modifiedCount !== 1) {
      throw new Error('Failed to update user after deleting files');
    }
    deletedFileCount++;
  }
  return { deletedFileCount };
};

// File listing function
export const listFiles = async (files: string[] = []) => {
  const userId = await getUserId();
  const db = client.db('AtlasII');
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne(
    { _id: new ObjectId(userId) },
    { projection: { 'knowledgebase.files': 1 } }
  );

  // Retrieve the user's files or set to an empty array if not found
  const allFiles = user?.knowledgebase?.files ?? [];

  // Filter the files if the files[] array is provided
  const filteredFiles =
    files.length > 0
      ? allFiles.filter((file: string) => files.includes(file))
      : allFiles;

  return { files: filteredFiles, hasMore: false }; // Adjust hasMore based on pagination logic
};

export const getFileUrls = async (list: string[]) => {
  const response = await utapi.getFileUrls(list);
  return response;
};

export type OurFileRouter = typeof ourFileRouter;
