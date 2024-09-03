import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UTApi } from 'uploadthing/server';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';
import { getUserId } from '@/lib/service/mongodb';
const utapi = new UTApi();
const f = createUploadthing();

// Utility function to handle database updates
const updateUserFiles = async (userId: string, uploadedFile: any) => {
  try {
    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: { 'knowledgebase.files': uploadedFile },
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    if (result.modifiedCount !== 1) {
      throw new Error('Failed to update user');
    }

    return { message: 'User updated successfully' };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

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

// File deletion function
export const deleteFiles = async (files: string[] | string) => {
  try {
    const filesArray = Array.isArray(files) ? files : [files];
    const response = await utapi.deleteFiles(filesArray);

    if (response.success && response.deletedCount > 0) {
      const userId = await getUserId();
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
    } else {
      throw new Error('File does not exist');
    }

    return { success: response.success, deleteCount: response.deletedCount };
  } catch (error: any) {
    console.error(`Error deleting files: ${error.message}`);
    throw new Error(`Error deleting files: ${error.message}`);
  }
};

// File listing function
export const listFiles = async () => {
  try {
    const userId = await getUserId();
    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { 'knowledgebase.files': 1 } }
    );

    const files = user?.knowledgebase?.files ?? [];
    return { files, hasMore: false }; // Adjust hasMore based on pagination logic
  } catch (error: any) {
    console.error('Error listing files:', error);
    throw new Error('Error listing files:', error);
  }
};
export const getFileUrls = async (list: string[]) => {
  try {
    const response = await utapi.getFileUrls(list);
    return response;
  } catch (error: any) {
    console.error(error);
    throw new Error('Error retrieving file urls', error);
  }
};

export type OurFileRouter = typeof ourFileRouter;
