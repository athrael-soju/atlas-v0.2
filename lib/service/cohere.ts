import { CohereClient } from 'cohere-ai';
import { RerankResponseResultsItem } from 'cohere-ai/api/types';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY ?? ''
});

if (!process.env.COHERE_API_KEY) {
  throw new Error('COHERE_API_KEY is not set');
}

const model = process.env.COHERE_API_MODEL || 'rerank-multilingual-v3.0';

function formatResult(
  result: RerankResponseResultsItem,
  index: number
): string {
  const doc = result.document as any;
  return `
Document ${index + 1}:
Filename: ${doc.filename || 'N/A'}
Filetype: ${doc.filetype || 'N/A'}
Languages: ${doc.languages || 'N/A'}
Page Number: ${doc.page_number || 'N/A'}
Relevance Score: ${result.relevanceScore.toFixed(4)}

Content:
${doc.text || 'No content available'}
`;
}

export async function rerank(
  userMessage: string,
  queryResults: any[],
  cohereTopN: number,
  cohereRelevanceThreshold: number
): Promise<string> {
  if (queryResults.length < 1) {
    return 'Context: Query results are empty. No relevant documents found.';
  }

  const rerankResponse = await cohere.rerank({
    model: model,
    documents: queryResults,
    rankFields: ['text', 'filename', 'page_number', 'filetype', 'languages'],
    query: userMessage,
    topN: cohereTopN,
    returnDocuments: true
  });

  if (rerankResponse.results.length > 0) {
    // Filter results based on relevance score
    const filteredResults = rerankResponse.results.filter(
      (result) => result.relevanceScore >= cohereRelevanceThreshold
    );

    if (filteredResults.length > 0) {
      const formattedResults = filteredResults
        .map(formatResult)
        .join('\n---\n');
      return `Context: The following are the top ${cohereTopN} most relevant documents you can use to respond to user message: "${userMessage}". Each document is separated by "---".\n\n${formattedResults}\n\nContext: End of results.\n\nUser message: ${userMessage}\n\n`;
    } else {
      return `Context: No relevant documents found with a relevance score of ${cohereRelevanceThreshold} or higher.\n\nUser message: ${userMessage}\n\n`;
    }
  } else {
    return 'Context: No relevant documents found.\n\nUser message: ${userMessage}\n\n';
  }
}
