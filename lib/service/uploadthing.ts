import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { UTApi } from 'uploadthing/server';
import { getAuthSession } from '@/auth';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';

const utapi = new UTApi();
const f = createUploadthing();

// Centralized middleware to get the userId
const getUserId = async () => {
  const session = await getAuthSession();
  if (!session?.user.id) {
    throw new UploadThingError('Unauthorized');
  }
  return session.user.id;
};

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
    dateUploaded: new Date().toISOString()
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
  image: defineFileRouter({ image: { maxFileSize: '4MB', maxFileCount: 1 } }),
  attachment: defineFileRouter(['text', 'image', 'video', 'audio', 'pdf']),
  video: defineFileRouter({ video: { maxFileCount: 1, maxFileSize: '512GB' } })
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

export type OurFileRouter = typeof ourFileRouter;
