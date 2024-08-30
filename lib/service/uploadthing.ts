import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { UTApi } from 'uploadthing/server';
import { getAuthSession } from '@/auth';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';
import { UploadedFile } from '@/types/uploadthing';

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
const updateUserFiles = async (userId: string, file: any) => {
  try {
    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new Error('User not found');
    }

    const combinedFiles = [...(user.knowledgebase?.files || []), file];

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'knowledgebase.files': combinedFiles,
          updatedAt: new Date().toISOString()
        }
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

// FileRouter implementation
export const ourFileRouter = {
  image: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => ({ userId: await getUserId() }))
    .onUploadComplete(async ({ metadata, file }) => {
      const uploadedFile = {
        name: file.name,
        url: file.url,
        size: file.size,
        key: file.key
      };
      await updateUserFiles(metadata.userId, uploadedFile);
    }),
  attachment: f(['text', 'image', 'video', 'audio', 'pdf'])
    .middleware(async () => ({ userId: await getUserId() }))
    .onUploadComplete(async ({ metadata, file }) => {
      const uploadedFile = {
        name: file.name,
        url: file.url,
        size: file.size,
        key: file.key
      };
      await updateUserFiles(metadata.userId, uploadedFile);
    }),
  video: f({ video: { maxFileCount: 1, maxFileSize: '512GB' } })
    .middleware(async () => ({ userId: await getUserId() }))
    .onUploadComplete(async ({ metadata, file }) => {
      const uploadedFile = {
        name: file.name,
        url: file.url,
        size: file.size,
        key: file.key
      };
      await updateUserFiles(metadata.userId, uploadedFile);
    })
} satisfies FileRouter;

// File deletion function
export const deleteFiles = async (files: string[] | string) => {
  try {
    // Normalize files to be an array
    const filesArray = Array.isArray(files) ? files : [files];
    // First, delete the files from the upload service
    const response = await utapi.deleteFiles(filesArray);

    if (response.success && response.deletedCount > 0) {
      // Get the userId from the session
      const userId = await getUserId();

      // Connect to the MongoDB database and collection
      const db = client.db('AtlasII');
      const usersCollection = db.collection('users');

      // Update the user's document to remove the deleted files
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $pull: {
            'knowledgebase.files': { key: { $in: filesArray } } as any
          },
          $set: {
            updatedAt: new Date().toISOString()
          }
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
    // Get the userId from the session
    const userId = await getUserId();

    // Connect to the MongoDB database and collection
    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');

    // Find the user and retrieve their files
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { 'knowledgebase.files': 1 } }
    );

    if (!user || !user.knowledgebase || !user.knowledgebase.files) {
      throw new Error('No files found for the user');
    }

    const files = user.knowledgebase.files;

    return { files, hasMore: false }; // Modify hasMore based on pagination logic if necessary
  } catch (error: any) {
    console.error('Error listing files:', error);
    throw new Error('Error listing files');
  }
};

export type OurFileRouter = typeof ourFileRouter;
