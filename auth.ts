import { getServerSession } from 'next-auth/next';
import authConfig from './auth.config';

// Function to fetch the session on the server-side
export async function getAuthSession() {
  return await getServerSession(authConfig);
}
