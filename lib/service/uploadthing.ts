import { UTApi } from 'uploadthing/server';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';
import { getUserId } from '@/lib/service/mongodb';
const utapi = new UTApi();
import { deleteFromVectorDb } from './pinecone';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { getLocalDateTime } from '@/lib/utils';

export const deleteFiles = async (
  userId: string,
  files: KnowledgebaseFile[]
) => {
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
        $pull: { 'files.knowledgebase': { key: { $in: filesArray } } as any },
        $set: {
          updatedAt: getLocalDateTime()
        }
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
    { projection: { 'files.knowledgebase': 1 } }
  );

  // Retrieve the user's files or set to an empty array if not found
  const allFiles = user?.files?.knowledgebase ?? [];

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
