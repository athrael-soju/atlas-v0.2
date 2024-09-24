import { NextAuthOptions, SessionStrategy, User } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import client from '@/lib/client/mongodb';
import { Adapter, AdapterUser } from 'next-auth/adapters';
import { Collection, Document, ObjectId } from 'mongodb';
import { IUser } from '@/models/User';
import { defaultUserSettings } from '@/constants/user';
import { createThread } from '@/lib/service/openai';
import { Conversation } from './types/data';
import * as emoji from 'node-emoji';
import { getLocalDateTime } from './lib/utils';

const ej = emoji.random();
const { GITHUB_ID, GITHUB_SECRET, GOOGLE_ID, GOOGLE_SECRET, NEXTAUTH_SECRET } =
  process.env;

if (
  !GITHUB_ID ||
  !GITHUB_SECRET ||
  !GOOGLE_ID ||
  !GOOGLE_SECRET ||
  !NEXTAUTH_SECRET
) {
  throw new Error('One or more required environment variables are missing.');
}

async function handleGuestLogin(usersCollection: Collection<Document>) {
  let guestUser = await usersCollection.findOne({ email: 'guest@example.com' });

  if (!guestUser) {
    const thread = await createThread();
    const conversation: Conversation = {
      id: thread.id,
      title: `${ej.emoji} ${ej.name}`,
      createdAt: getLocalDateTime(),
      active: true
    };

    const newGuestUser: IUser = {
      _id: new ObjectId(),
      name: 'Guest',
      email: 'guest@example.com',
      role: 'guest',
      createdAt: getLocalDateTime(),
      updatedAt: getLocalDateTime(),
      settings: defaultUserSettings(),
      files: {
        knowledgebase: [],
        analysis: []
      },
      data: {
        activeConversationId: conversation.id,
        conversations: [conversation]
      }
    };

    const result = await usersCollection.insertOne(newGuestUser);
    if (result.insertedId) {
      guestUser = await usersCollection.findOne({ _id: result.insertedId });
    }
  }

  return {
    id: guestUser?._id?.toString() || '',
    name: guestUser?.name,
    email: guestUser?.email
  };
}

async function findOrCreateUser(
  usersCollection: Collection<Document>,
  user: User | AdapterUser
) {
  let existingUser = await usersCollection.findOne({ email: user.email });

  if (!existingUser && user.name && user.email) {
    const thread = await createThread();
    const conversation: Conversation = {
      id: thread.id,
      title: `${ej.emoji} ${ej.name}`,
      createdAt: getLocalDateTime(),
      active: true
    };

    const newUser: IUser = {
      _id: new ObjectId(),
      name: user.name,
      email: user.email,
      createdAt: getLocalDateTime(),
      updatedAt: getLocalDateTime(),
      role: 'user',
      settings: defaultUserSettings(),
      files: {
        knowledgebase: [],
        analysis: []
      },
      data: {
        activeConversationId: conversation.id,
        conversations: [conversation]
      }
    };
    await usersCollection.insertOne(newUser);
    user.id = newUser._id.toString();
  } else if (existingUser) {
    await usersCollection.updateOne(
      { _id: new ObjectId(existingUser._id) },
      {
        $set: {
          updatedAt: getLocalDateTime()
        }
      }
    );
    user.id = existingUser._id.toString();
  }
  return user;
}

const authConfig: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: GITHUB_ID,
      clientSecret: GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true
    }),
    GoogleProvider({
      clientId: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    CredentialProvider({
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        try {
          await client.connect();
          const db = client.db('AtlasII');
          const usersCollection = db.collection('users');

          if (credentials?.email === 'guest@example.com') {
            return await handleGuestLogin(usersCollection);
          }

          // Other credential logic...
          return null;
        } catch (error) {
          console.error('Error in authorization function:', error);
          return null;
        }
      }
    })
  ],
  pages: { signIn: '/' },
  adapter: MongoDBAdapter(client) as Adapter,
  secret: NEXTAUTH_SECRET,
  session: { strategy: 'jwt' as SessionStrategy },
  callbacks: {
    async signIn({ user }) {
      try {
        await client.connect();
        const db = client.db('AtlasII');
        const usersCollection = db.collection('users');
        await findOrCreateUser(usersCollection, user);
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
} satisfies NextAuthOptions;

export default authConfig;
