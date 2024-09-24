'use server';

import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';
import client from '@/lib/client/mongodb';
import { IUser } from '@/models/User';
import { Db, ObjectId, UpdateResult } from 'mongodb';
import { Collection } from 'mongodb';
import { AssistantFile } from '@/types/data';
import { AssistantMode } from '@/types/settings';

// Helper function to connect to the database
const connectToDatabase = async (): Promise<Db> => {
  return client.db('AtlasII');
};

// Helper function to find a user by ID
const findUserById = async (db: Db, userId: string): Promise<IUser | null> => {
  const usersCollection = db.collection('users');
  return usersCollection.findOne({
    _id: new ObjectId(userId)
  }) as unknown as IUser;
};

// Generic function to update any field in the user's document
export const updateUserField = async (
  userId: string,
  updateOperation: any
): Promise<{ message: string }> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  const result = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    updateOperation
  );

  if (result.modifiedCount !== 1) {
    throw new Error('Failed to update user document');
  }

  return { message: `User document updated successfully` };
};

// Main functions
export const getUserData = async (userId: string) => {
  const session = await getServerSession(authConfig);
  if (!userId || session?.user.id !== userId) {
    throw new Error('Invalid user');
  }

  const db = await connectToDatabase();
  const user = await findUserById(db, userId);

  if (!user) {
    throw new Error('User not found in database');
  }

  const plainUser = {
    ...user,
    _id: user._id.toString()
  };

  return plainUser;
};

export const getUserId = async (): Promise<string | undefined> => {
  const session = await getServerSession(authConfig);
  return session?.user.id;
};

// Example usage of the generic update function
export const updateAssistantMode = async (
  userId: string,
  assistantMode: AssistantMode
): Promise<{ message: string }> => {
  return updateUserField(userId, {
    $set: {
      'settings.chat.assistantMode': assistantMode,
      updatedAt: new Date().toISOString()
    }
  });
};

export const updateUserFiles = async (
  userId: string,
  knowledgebaseFile: any
): Promise<{ message: string }> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');

  // Perform the update, ensuring only the file data is pushed into the array
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: { 'files.knowledgebase': knowledgebaseFile },
      $set: { updatedAt: new Date().toISOString() }
    }
  );

  return { message: 'File uploaded successfully' };
};

// Assume connectToDatabase is already defined and returns a connected MongoDB client
export const updateAssistantFiles = async (
  userId: string,
  assistantFiles: AssistantFile[]
): Promise<UpdateResult<IUser>> => {
  const db = await connectToDatabase();
  // Type the collection with the User interface
  const usersCollection: Collection<IUser> = db.collection<IUser>('users');

  // Define the update document with correct types
  const update = {
    $push: {
      'files.analysis': { $each: assistantFiles }
    },
    $set: {
      updatedAt: new Date().toISOString()
    }
  };

  // Perform the update
  const result: UpdateResult<IUser> = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    update
  );

  return result;
};

export const deleteAssistantFiles = async (
  userId: string,
  files: AssistantFile[]
): Promise<string[]> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');

  // Assuming 'files' is an array of file objects with unique identifiers
  const fileIds = files.map((file) => file.id); // Modify this based on your file structure

  // Update the file, or have a specific field to store the openAI Id
  const result = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: {
        'files.analysis': {
          id: { $in: fileIds as string[] }
        } as any
      },
      $set: {
        updatedAt: new Date().toISOString()
      }
    }
  );

  if (result.modifiedCount === 0) {
    throw new Error(
      `No files matching the provided IDs were found for user '${userId}'`
    );
  }

  return fileIds;
};

export const updateFileDateProcessed = async (
  userId: string,
  filesToUpdate: { key: string; dateProcessed: string }[]
): Promise<{ message: string }> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  const date = new Date().toISOString();
  const updateOperations = filesToUpdate.map((file) =>
    usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'files.knowledgebase.$[elem].dateProcessed': date,
          updatedAt: new Date().toISOString()
        }
      },
      {
        arrayFilters: [{ 'elem.key': file.key }]
      }
    )
  );

  await Promise.all(updateOperations);
  return { message: 'File dateProcessed updated successfully' };
};

export const getActiveAnalysisFiles = async (
  userId: string
): Promise<string[]> => {
  const user = await getUserData(userId);
  const activeFiles = user.files.analysis.filter((file) => file.isActive);
  return activeFiles.map((file) => file.id);
};
