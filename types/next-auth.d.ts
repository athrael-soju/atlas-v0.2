import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  type UserSession = DefaultSession['user'] & { id: string };

  interface Session {
    user: UserSession;
  }

  interface CredentialsInputs {
    email: string;
    password: string;
  }
}
