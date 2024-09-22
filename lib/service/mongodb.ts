'use server';

import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';
import client from '@/lib/client/mongodb';
import { IUser } from '@/models/User';
import { Db, ObjectId } from 'mongodb';
import { FileObject } from 'openai/resources/files.mjs';
import { Collection } from 'mongodb';

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
export const updateKnowledgebaseEnabled = async (
  userId: string,
  enabled: boolean
): Promise<{ message: string }> => {
  return updateUserField(userId, {
    $set: {
      'settings.chat.knowledgebaseEnabled': enabled,
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
export const updateAnalysisFiles = async (
  userId: string,
  openaiFiles: FileObject[]
): Promise<{ message: string }> => {
  const db = await connectToDatabase();

  // Type the collection with the User interface
  const usersCollection: Collection<IUser> = db.collection<IUser>('users');

  // Define the update document with correct types
  const update = {
    $push: {
      'files.analysis': { $each: openaiFiles }
    },
    $set: {
      updatedAt: new Date().toISOString()
    }
  };

  // Perform the update
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    update as any // Use type assertion here
  );

  return { message: 'Analysis files uploaded successfully' };
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
