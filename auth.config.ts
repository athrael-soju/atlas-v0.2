import { NextAuthOptions, SessionStrategy } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import client from '@/lib/client/mongodb';
import { Adapter } from 'next-auth/adapters';
import { ObjectId } from 'mongodb';
import { IUser } from '@/models/User';

const authConfig: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    GoogleProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    CredentialProvider({
      credentials: {
        email: {
          type: 'email'
        },
        password: {
          type: 'password'
        }
      },
      async authorize(credentials, req) {
        try {
          await client.connect(); // Ensure the client is connected
          const db = client.db('AtlasII'); // Get the default database
          const usersCollection = db.collection('users');

          // Check if the credentials are for a guest account
          if (credentials?.email === 'guest@example.com') {
            // Check if a guest account already exists in the database
            let guestUser = await usersCollection.findOne({
              email: 'guest@example.com'
            });

            if (!guestUser) {
              // If the guest account does not exist, create it
              const newGuestUser: IUser = {
                name: 'Guest User',
                email: 'guest@example.com',
                role: 'guest',
                createdAt: new Date().toString(),
                updatedAt: new Date().toString()
              };

              const result = await usersCollection.insertOne(newGuestUser);
              if (result.insertedId) {
                guestUser = await usersCollection.findOne({
                  _id: result.insertedId
                });
              }
            }

            return {
              id: guestUser?._id?.toString() || '',
              name: guestUser?.name,
              email: guestUser?.email
            };
          }

          // Logic for other credential users can be added here
          return null;
        } catch (error) {
          console.error('Error in authorize function:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/'
  },
  adapter: MongoDBAdapter(client) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as SessionStrategy
  },
  callbacks: {
    async signIn({ user }) {
      try {
        await client.connect();
        const db = client.db('AtlasII');
        const usersCollection = db.collection('users');

        const existingUser = await usersCollection.findOne({
          email: user.email
        });

        if (!existingUser) {
          if (user.name && user.email) {
            // New user, add createdAt and updatedAt fields
            const newUser: IUser = {
              name: user.name,
              email: user.email,
              createdAt: new Date().toString(),
              updatedAt: new Date().toString(),
              role: 'user' // or determine role based on your requirements
            };

            await usersCollection.insertOne(newUser);
          } else {
            console.error('User object does not contain name and email');
            return false;
          }
        } else {
          // Existing user, update the updatedAt field
          await usersCollection.updateOne(
            { _id: new ObjectId(existingUser._id) },
            { $set: { updatedAt: new Date().toString() } }
          );
        }
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    }
  }
} satisfies NextAuthOptions;

export default authConfig;
