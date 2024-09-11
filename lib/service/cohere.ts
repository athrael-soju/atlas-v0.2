import { RerankResponseResultsItem } from 'cohere-ai/api/types';
import { cohere, model } from '@/lib/client/cohere';
import { KnowledgebaseSettings, ProfileSettings } from '@/types/settings';
import { addPersonalizedInfo, formatFilteredResults } from '@/lib/utils';

// Function to filter the results based on the relevance score threshold
function filterResults(
  results: RerankResponseResultsItem[],
  relevanceThreshold: number
): RerankResponseResultsItem[] {
  return results.filter(
    (result) => result.relevanceScore >= relevanceThreshold
  );
}

// Main function to rerank and handle the response
export async function rerank(
  userMessage: string,
  queryResults: any[],
  knowledgebaseSettings: KnowledgebaseSettings,
  profileSettings: ProfileSettings
): Promise<string> {
  if (queryResults.length < 1) {
    return 'Context: Query results are empty. No relevant documents found.';
  }

  const rerankResponse = await cohere.rerank({
    model: model,
    documents: queryResults,
    rankFields: ['text', 'filename', 'page_number', 'filetype', 'languages'],
    query: userMessage,
    topN: knowledgebaseSettings.cohereTopN,
    returnDocuments: true
  });

  if (rerankResponse.results.length > 0) {
    const filteredResults = filterResults(
      rerankResponse.results,
      knowledgebaseSettings.cohereRelevanceThreshold
    );

    if (filteredResults.length > 0) {
      let message = formatFilteredResults(
        filteredResults,
        knowledgebaseSettings.cohereTopN,
        userMessage
      );
      message = addPersonalizedInfo(message, profileSettings);
      return message;
    } else {
      return `Context: No relevant documents found with a relevance score of ${knowledgebaseSettings.cohereRelevanceThreshold} or higher.
      User message: ${userMessage}`;
    }
  } else {
    return `Context: No relevant documents found.
    User message: ${userMessage}`;
  }
}
