import { openai } from '@/lib/client/openai';
// Potentially check for knowledgebase and profile customization here, instead of making 2 additional API calls.
const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params: { threadId } }: { params: { threadId: string } }
) {
  const { text } = await request.json();

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: text
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId
  });

  return new Response(stream.toReadableStream());
}
