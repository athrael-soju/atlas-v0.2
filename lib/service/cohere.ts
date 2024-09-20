import { RerankResponseResultsItem } from 'cohere-ai/api/types';
import { cohere, model } from '@/lib/client/cohere';
import { KnowledgebaseSettings } from '@/types/settings';
import { formatFilteredResults } from '@/lib/utils';

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
  knowledgebaseSettings: KnowledgebaseSettings
): Promise<string> {
  if (queryResults.length < 1) {
    return `
==============
Context: No relevant documents found to rerank.
==============
`;
  }

  const rerankResponse = await cohere.rerank({
    model: model,
    documents: queryResults,
    rankFields: ['text', 'filename', 'page_number', 'filetype', 'languages'],
    query: userMessage,
    topN: knowledgebaseSettings.cohereTopN,
    returnDocuments: true
  });

  const filteredResults = filterResults(
    rerankResponse.results,
    knowledgebaseSettings.cohereRelevanceThreshold
  );

  if (filteredResults.length > 0) {
    let formattedResults = formatFilteredResults(filteredResults);
    return formattedResults;
  } else {
    return `
==============
Context: No relevant documents found with a relevance score of ${knowledgebaseSettings.cohereRelevanceThreshold} or higher.
==============`;
  }
}
