import { NextAuthOptions, SessionStrategy } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import client from '@/lib/client/mongodb';
import { Adapter } from 'next-auth/adapters';

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
          const db = client.db(); // Get the default database
          const usersCollection = db.collection('users');

          // Check if the credentials are for a guest account
          if (credentials?.email === 'guest@example.com') {
            // Check if a guest account already exists in the database
            let guestUser = await usersCollection.findOne({
              email: 'guest@example.com'
            });

            if (!guestUser) {
              // If the guest account does not exist, create it
              const newGuestUser = {
                name: 'Guest User',
                email: 'guest@example.com',
                role: 'guest',
                createdAt: new Date(),
                updatedAt: new Date()
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
  }
} satisfies NextAuthOptions;

export default authConfig;
