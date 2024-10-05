import { rerank } from '@/lib/service/cohere';
import { embedMessage } from '@/lib/service/openai';
import { getVectorDbProvider } from '@/lib/service/vector-db/factory';
import { validateUser } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { Embedding } from '@/types/settings';
import {
  logInfo,
  logError,
  logWarn,
  logSuccess,
  logTiming
} from '@/lib/service/logging';

function sendUpdate(
  status: string,
  message: string,
  controller: ReadableStreamDefaultController
): void {
  const data = JSON.stringify({ status, message });
  controller.enqueue(`data: ${data}\n\n`);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  logInfo('==================== START GET REQUEST ====================');
  logInfo('GET request received for retrieving context');

  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const message = searchParams.get('message');

    if (!userId || !message) {
      logWarn('No userId or message provided');
      logTiming('GET request handling', startTime);
      logInfo('==================== END GET REQUEST ======================');
      return NextResponse.json(
        { error: 'No userId or message provided' },
        { status: 400 }
      );
    }

    // Validate user
    const userServerData = await validateUser(userId);

    const settings = userServerData.settings;

    // Setup and return SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const send = (state: string, message: string) =>
          sendUpdate(state, message, controller);

        retrieveContext(userId, message, settings, send)
          .then(() => {
            logSuccess('Context retrieved successfully');
            logTiming('GET request handling', startTime);
            logInfo(
              '==================== END GET REQUEST ======================'
            );
            controller.close();
          })
          .catch((err) => {
            logError(`Error retrieving context - ${err.message}`);
            logTiming('GET request handling', startTime);
            logInfo(
              '==================== END GET REQUEST ======================'
            );
            controller.error(err);
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
  } catch (error: any) {
    logError(`Error occurred during GET request - ${error.message}`);
    logTiming('GET request handling', startTime);
    logInfo('==================== END GET REQUEST ======================');
    return handleErrorResponse(error);
  }
}

async function retrieveContext(
  userId: string,
  message: string,
  settings: any,
  sendUpdate: (status: string, message: string) => void
): Promise<void> {
  let rerankingContext = '';
  try {
    sendUpdate('Retrieving context', `${message}`);
    // Embed the message
    const embeddingResults = (await embedMessage(userId, message)) as Embedding;
    sendUpdate(
      'Embedding complete',
      `Message embedding complete for: ${message}`
    );

    // Query Vector DB from the factory with the embedding
    const vectorDbProvider = await getVectorDbProvider(
      settings.forge.vectorizationProvider
    );
    const queryResults = await vectorDbProvider.query(
      userId,
      embeddingResults,
      settings.knowledgebase.vectorDbTopK
    );
    sendUpdate('Query complete', 'Query results retrieved from Vector DB.');

    if (queryResults.context.length > 0) {
      // Rerank the results
      rerankingContext = await rerank(
        message,
        queryResults.context,
        settings.knowledgebase
      );
      sendUpdate('Reranking complete', `${rerankingContext}`);
    } else {
      sendUpdate('No context', 'No context found for the message.');
    }
  } catch (error: any) {
    sendUpdate('Error', `Error retrieving context: ${error.message}`);
  } finally {
    sendUpdate('Done', `Processing complete for: ${message}`);
  }
}

function handleErrorResponse(error: any): NextResponse {
  const status = ['Invalid user', 'Invalid file IDs'].includes(error.message)
    ? 400
    : 500;

  return new NextResponse(
    JSON.stringify({ message: error.message || 'Internal server error' }),
    { status }
  );
}
