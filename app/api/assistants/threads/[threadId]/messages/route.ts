import { openai } from '@/lib/client/openai';

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params: { threadId } }: { params: { threadId: string } }
) {
  const { content } = await request.json();

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: content
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId
  });

  return new Response(stream.toReadableStream());
}
