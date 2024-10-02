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
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';

// Helper function to connect to the database
const connectToDatabase = async (): Promise<Db> => {
  logger.info(chalk.blue('Connecting to database...'));
  return client.db('AtlasV1');
};

// Helper function to find a user by ID
const findUserById = async (db: Db, userId: string): Promise<IUser | null> => {
  logger.info(chalk.blue(`Finding user with ID: ${userId}`));
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
    logger.error(
      chalk.red(`Failed to update user document for userId: ${userId}`)
    );
    throw new Error('Failed to update user document');
  }

  logger.info(
    chalk.green(`User document updated successfully for userId: ${userId}`)
  );
  return { message: `User document updated successfully` };
};

// Main functions
export const getUserData = async (userId: string) => {
  const session = await getServerSession(authConfig);

  // Convert session ID to ObjectId for MongoDB querying
  const sessionUserId = session?.user.id;

  if (!userId || sessionUserId !== userId) {
    logger.error(
      chalk.red(`Invalid user access attempt for userId: ${userId}`)
    );
    throw new Error('Invalid user');
  }

  // Ensure the userId matches the MongoDB ObjectId format
  const db = await connectToDatabase();
  const objectId = new ObjectId(userId);
  const user = await findUserById(db, objectId.toString()); // Ensure proper conversion
  
  if (!user) {
    logger.error(chalk.red(`User not found in database for userId: ${userId}`));
    throw new Error('User not found in database');
  }

  const plainUser = {
    ...user,
    _id: user._id.toString()
  };

  logger.info(chalk.green(`User data retrieved for userId: ${userId}`));
  return plainUser;
};

export const getUserId = async (): Promise<string | undefined> => {
  const session = await getServerSession(authConfig);
  logger.info(
    chalk.blue(`Getting user ID from session for user: ${session?.user.id}`)
  );
  return session?.user.id;
};

// Example usage of the generic update function
export const updateAssistantMode = async (
  userId: string,
  assistantMode: AssistantMode
): Promise<{ message: string }> => {
  logger.info(chalk.blue(`Updating assistant mode for userId: ${userId}`));
  return updateUserField(userId, {
    $set: {
      'settings.chat.assistantMode': assistantMode,
      updatedAt: getLocalDateTime()
    }
  });
};

export const updateUserFiles = async (
  userId: string,
  knowledgebaseFile: any
): Promise<{ message: string }> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  logger.info(chalk.blue(`Updating user files for userId: ${userId}`));
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: { 'files.knowledgebase': knowledgebaseFile },
      $set: {
        updatedAt: getLocalDateTime()
      }
    }
  );
  logger.info(chalk.green(`File uploaded successfully for userId: ${userId}`));
  return { message: 'File uploaded successfully' };
};

// Assume connectToDatabase is already defined and returns a connected MongoDB client
export const updateAssistantFiles = async (
  userId: string,
  assistantFiles: AssistantFile[]
): Promise<UpdateResult<IUser>> => {
  const db = await connectToDatabase();
  const usersCollection: Collection<IUser> = db.collection<IUser>('users');
  logger.info(chalk.blue(`Updating assistant files for userId: ${userId}`));
  const update = {
    $push: {
      'files.analysis': { $each: assistantFiles }
    },
    $set: {
      updatedAt: getLocalDateTime()
    }
  };

  const result: UpdateResult<IUser> = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    update
  );

  logger.info(chalk.green(`Assistant files updated for userId: ${userId}`));
  return result;
};

export const deleteAssistantFiles = async (
  userId: string,
  files: AssistantFile[]
): Promise<string[]> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  const fileIds = files.map((file) => file.id); // Modify this based on your file structure
  logger.info(chalk.blue(`Deleting assistant files for userId: ${userId}`));

  const result = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: {
        'files.analysis': {
          id: { $in: fileIds as string[] }
        } as any
      },
      $set: {
        updatedAt: getLocalDateTime()
      }
    }
  );

  if (result.modifiedCount === 0) {
    logger.error(
      chalk.red(
        `No files matching the provided IDs were found for user: ${userId}`
      )
    );
    throw new Error(
      `No files matching the provided IDs were found for user '${userId}'`
    );
  }

  logger.info(
    chalk.green(`Successfully deleted assistant files for userId: ${userId}`)
  );
  return fileIds;
};

export const updateFileDateProcessed = async (
  userId: string,
  filesToUpdate: { key: string; dateProcessed: string }[]
): Promise<{ message: string }> => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  logger.info(chalk.blue(`Updating file dateProcessed for userId: ${userId}`));

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
  logger.info(
    chalk.green(`File dateProcessed updated successfully for userId: ${userId}`)
  );
  return { message: 'File dateProcessed updated successfully' };
};

export const getActiveAnalysisFiles = async (
  userId: string
): Promise<string[]> => {
  const user = await getUserData(userId);
  logger.info(
    chalk.blue(`Getting active analysis files for userId: ${userId}`)
  );
  const activeFiles = user.files.analysis.filter((file) => file.isActive);
  logger.info(
    chalk.green(
      `Found ${activeFiles.length} active analysis files for userId: ${userId}`
    )
  );
  return activeFiles.map((file) => file.id);
};
