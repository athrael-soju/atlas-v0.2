import { openai } from '@/lib/client/openai';
import { Assistant } from 'openai/resources/beta/assistants.mjs';

export const runtime = 'nodejs';

const assistantId = process.env.OPENAI_ASSISTANT_ID as string;

if (!assistantId) {
  throw new Error('Missing OPENAI_ASSISTANT_ID');
}

export async function PUT(request: Request) {
  const formData = await request.formData();
  const userId = formData.get('userId') as string;

  if (!userId) {
    throw new Error('Invalid user or fileIds');
  }

  // Fetch the current assistant
  const assistant: Assistant =
    await openai.beta.assistants.retrieve(assistantId);

  if (!assistant) {
    throw new Error('Failed to retrieve the assistant');
  }
  // Update the assistant with the new fileIds list
  const updatedAssistant: Assistant = await openai.beta.assistants.update(
    assistantId,
    {
      instructions:
        'You are a knowledgebase assistant with access to a vast library of documents. You can seek information from these documents to answer questions or provide explanations. If you are not able to find the information you are looking for, within the documents, you can respond that you do not have the information. Keep your responses succinct and informative, but not overly verbose.',
      name: 'Knowledgebase',
      tools: [{ type: 'file_search' }],
      tool_resources: null
    }
  );
  if (!updatedAssistant) {
    throw new Error('Failed to update assistant with new fileIds');
  }

  return new Response(JSON.stringify({ assistant: updatedAssistant }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
