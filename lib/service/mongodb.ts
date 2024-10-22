'use server';

import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';
import client from '@/lib/client/mongodb';
import { IUser } from '@/models/User';
import { Db, ObjectId, UpdateResult } from 'mongodb';
import { Collection } from 'mongodb';
import { AssistantFile } from '@/types/data';
import { AssistantMode } from '@/types/settings';
import { getLocalDateTime } from '@/lib/utils';

// Helper function to connect to the database
const connectToDatabase = async (): Promise<Db> => {
  const db = client.db('AtlasV1');
  return db;
};

// Helper function to find a user by ID
const findUserById = async (db: Db, userId: string): Promise<IUser | null> => {
  const usersCollection = db.collection('users');
  const user = (await usersCollection.findOne({
    _id: new ObjectId(userId)
  })) as unknown as IUser;
  return user;
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

  const sessionUserId = session?.user.id;

  if (!userId || sessionUserId !== userId) {
    throw new Error('Invalid user');
  }

  const db = await connectToDatabase();
  const objectId = new ObjectId(userId);
  const user = await findUserById(db, objectId.toString());

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
  const result = await updateUserField(userId, {
    $set: {
      'settings.chat.assistantMode': assistantMode,
      updatedAt: getLocalDateTime()
    }
  });
  return result;
};

export const updateUserFiles = async (
  userId: string,
  knowledgebaseFile: any
): Promise<{ message: string }> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: { 'files.knowledgebase': knowledgebaseFile },
      $set: {
        updatedAt: getLocalDateTime()
      }
    }
  );
  return { message: 'File uploaded successfully' };
};

export const addAssistantFiles = async (
  userId: string,
  assistantFiles: AssistantFile[]
): Promise<UpdateResult<IUser>> => {
  const db = await connectToDatabase();
  const usersCollection: Collection<IUser> = db.collection<IUser>('users');

  const result: UpdateResult<IUser> = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: {
        'files.analysis': { $each: assistantFiles }
      },
      $set: {
        updatedAt: getLocalDateTime()
      }
    }
  );

  return result;
};

export const removeAssistantFiles = async (
  userId: string,
  fileIds: string[]
): Promise<UpdateResult<IUser>> => {
  const db = await connectToDatabase();
  const usersCollection: Collection<IUser> = db.collection<IUser>('users');

  const result: UpdateResult<IUser> = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: {
        'files.analysis': { id: { $in: fileIds } }
      },
      $set: {
        updatedAt: getLocalDateTime()
      }
    }
  );

  return result;
};

export const updateAssistantFileStatus = async (
  userId: string,
  assistantFile: AssistantFile
): Promise<UpdateResult<IUser>> => {
  const db = await connectToDatabase();
  const usersCollection: Collection<IUser> = db.collection<IUser>('users');

  const result: UpdateResult<IUser> = await usersCollection.updateOne(
    { _id: new ObjectId(userId), 'files.analysis.id': assistantFile.id },
    {
      $set: {
        'files.analysis.$.isActive': assistantFile.isActive,
        updatedAt: getLocalDateTime()
      }
    }
  );

  return result;
};

export const updateFileDateProcessed = async (
  userId: string,
  filesToUpdate: { key: string; dateProcessed: string }[]
): Promise<{ message: string }> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');

  const updateOperations = filesToUpdate.map((file) =>
    usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'files.knowledgebase.$[elem].dateProcessed': getLocalDateTime(),
          updatedAt: getLocalDateTime()
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
  const activeFiles = user.files.analysis.filter((file) => file.isActive === true);
  return activeFiles.map((file) => file.id);
};
