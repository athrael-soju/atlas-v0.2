// app/api/auth/[...nextauth]/route.ts
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
      clientSecret: process.env.GITHUB_SECRET ?? '',
      allowDangerousEmailAccountLinking: true
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
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
                _id: new ObjectId(),
                name: 'Guest User',
                email: 'guest@example.com',
                role: 'guest',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                settings: {
                  forge: {
                    parsingProvider: 'io',
                    minChunkSize: 0,
                    maxChunkSize: 512,
                    chunkOverlap: 0,
                    chunkBatch: 50,
                    partitioningStrategy: 'fast',
                    chunkingStrategy: 'basic'
                  }
                },
                knowledgebase: {
                  files: []
                }
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
              _id: new ObjectId(),
              name: user.name,
              email: user.email,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              role: 'user',
              settings: {
                forge: {
                  parsingProvider: 'io',
                  minChunkSize: 0,
                  maxChunkSize: 512,
                  chunkOverlap: 0,
                  chunkBatch: 50,
                  partitioningStrategy: 'fast',
                  chunkingStrategy: 'basic'
                }
              },
              knowledgebase: {
                files: []
              }
            };

            await usersCollection.insertOne(newUser);
            user.id = newUser._id.toString(); // Add the new user's ID to the user object
          } else {
            console.error('User object does not contain name and email');
            return false;
          }
        } else {
          // Existing user, update the updatedAt field
          await usersCollection.updateOne(
            { _id: new ObjectId(existingUser._id) },
            { $set: { updatedAt: new Date().toISOString() } }
          );
          user.id = existingUser._id.toString(); // Add the existing user's ID to the user object
        }
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // On the initial sign-in, `user` will be available
      if (user) {
        token.id = user.id; // Persist the user ID in the token
      }

      // If the user object is undefined (on subsequent requests), use the token's sub as the ID
      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      return token;
    },
    async session({ session, token }) {
      // Ensure session.user exists before attempting to add the ID
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    }
  }
} satisfies NextAuthOptions;

export default authConfig;
