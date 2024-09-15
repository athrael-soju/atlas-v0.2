import { createThread } from '@/lib/service/openai';

export const runtime = 'nodejs';

export async function POST() {
  const thread = await createThread();
  return Response.json({ threadId: thread.id });
}
