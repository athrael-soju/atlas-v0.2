'use server';

import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';
import client from '@/lib/client/mongodb';
import { IUser } from '@/models/User';
import { ObjectId } from 'mongodb';

export const getUserData = async (userId: string) => {
  const session = await getServerSession(authConfig);
  if (!userId || session?.user.id !== userId) {
    throw new Error('Invalid user');
  }
  const db = client.db('AtlasII');
  const usersCollection = db.collection('users');

  const user = (await usersCollection.findOne({
    _id: new ObjectId(userId)
  })) as IUser;

  if (!user) {
    throw new Error('User not found in database');
  }

  const plainUser = {
    ...user,
    _id: user._id.toString()
  };

  return plainUser;
};

export const getUserId = async () => {
  const session = await getServerSession(authConfig);
  return session?.user.id;
};

export const updateFileDateProcessed = async (
  userId: string,
  filesToUpdate: { key: string; dateProcessed: string }[]
) => {
  try {
    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');
    const date = new Date().toISOString();
    const updateOperations = filesToUpdate.map((file) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(userId),
          'knowledgebase.files.key': file.key
        },
        update: {
          $set: {
            'knowledgebase.files.$.dateProcessed': date,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }));

    const result = await usersCollection.bulkWrite(updateOperations);

    if (result.modifiedCount === 0) {
      throw new Error('No files were updated');
    }

    return { message: 'File dateProcessed updated successfully' };
  } catch (error: any) {
    throw new Error(`Error updating file dateProcessed: ${error.message}`);
  }
};
