import { rerank } from '@/lib/service/cohere';
import { embedMessage } from '@/lib/service/openai';
import { query } from '@/lib/service/pinecone';
import { validateUser } from '@/lib/utils';
import { IUser } from '@/models/User';
import { KnowledgebaseSettings } from '@/types/settings';
import { NextRequest, NextResponse } from 'next/server';

function sendUpdate(
  status: string,
  message: string,
  controller: ReadableStreamDefaultController
): void {
  const data = JSON.stringify({ status, message });
  controller.enqueue(`data: ${data}\n\n`);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const message = searchParams.get('message');

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Validate user
    const userServerData: IUser = await validateUser(userId);
    const settings = userServerData.settings
      .knowledgebase as KnowledgebaseSettings;

    // Retrieve context
    const stream = new ReadableStream({
      start(controller) {
        const send = (state: string, message: string) =>
          sendUpdate(state, message, controller);
        retrieveContext(userId, message, settings, send).then(() => {
          controller.close();
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    return handleErrorResponse(error);
  }
}

async function retrieveContext(
  userId: string,
  message: string,
  settings: KnowledgebaseSettings,
  sendUpdate: (status: string, message: string) => void
): Promise<void> {
  let rerankingContext = '';
  try {
    sendUpdate('Retrieving context', `${message}`);

    const embeddingResults = await embedMessage(userId, message);
    sendUpdate('Embedding complete', `${message}`);

    const queryResults = await query(
      userId,
      embeddingResults,
      settings.pineconeTopK
    );
    sendUpdate('Query complete', `${message}`);

    rerankingContext = await rerank(
      message,
      queryResults.context,
      settings.cohereTopN,
      settings.cohereRelevanceThreshold
    );
    sendUpdate('Reranking complete', `${rerankingContext}`);
  } catch (error: any) {
    sendUpdate('error', `Error retrieving context: ${error.message}`);
  } finally {
    sendUpdate('done', `${message}`);
  }
}

function handleErrorResponse(error: any): NextResponse {
  const status =
    error.message === 'Invalid user' || error.message === 'Invalid file IDs'
      ? 400
      : 500;
  return new NextResponse(
    JSON.stringify({ message: error.message || 'Internal server error' }),
    { status }
  );
}
