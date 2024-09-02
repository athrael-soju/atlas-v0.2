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

  return user;
};

export const getUserId = async () => {
  const session = await getServerSession(authConfig);
  return session?.user.id;
};
