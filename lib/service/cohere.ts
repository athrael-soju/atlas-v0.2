import { RerankResponseResultsItem } from 'cohere-ai/api/types';
import { cohere, model } from '@/lib/client/cohere';
import { KnowledgebaseSettings } from '@/types/settings';
import { formatFilteredResults } from '@/lib/utils';
import { logger } from '@/lib/service/winston';

// Function to filter the results based on the relevance score threshold
function filterResults(
  results: RerankResponseResultsItem[],
  relevanceThreshold: number
): RerankResponseResultsItem[] {
  logger.info(
    `Filtering results with relevance score >= ${relevanceThreshold}. Total results: ${results.length}`
  );
  const filteredResults = results.filter(
    (result) => result.relevanceScore >= relevanceThreshold
  );
  logger.info(
    `Filtered results count: ${filteredResults.length} (Threshold: ${relevanceThreshold})`
  );
  return filteredResults;
}

// Main function to rerank and handle the response
export async function rerank(
  userMessage: string,
  queryResults: any[],
  knowledgebaseSettings: KnowledgebaseSettings
): Promise<string> {
  if (queryResults.length < 1) {
    logger.warn(
      `No relevant documents found to rerank for message: ${userMessage}`
    );
    return `
==============
Context: No relevant documents found to rerank.
==============
`;
  }

  try {
    logger.info(`Starting reranking process for user message: ${userMessage}`);

    const rerankResponse = await cohere.rerank({
      model: model,
      documents: queryResults,
      rankFields: ['text', 'filename', 'page_number', 'filetype', 'languages'],
      query: userMessage,
      topN: knowledgebaseSettings.cohereTopN,
      returnDocuments: true
    });

    logger.info(`Reranking completed. Processing results...`);

    const filteredResults = filterResults(
      rerankResponse.results,
      knowledgebaseSettings.cohereRelevanceThreshold
    );

    if (filteredResults.length > 0) {
      logger.info(
        `Found ${filteredResults.length} relevant documents after filtering.`
      );
      let formattedResults = formatFilteredResults(filteredResults);
      return formattedResults;
    } else {
      logger.warn(
        `No relevant documents found with a relevance score of ${knowledgebaseSettings.cohereRelevanceThreshold} or higher.`
      );
      return `
==============
Context: No relevant documents found with a relevance score of ${knowledgebaseSettings.cohereRelevanceThreshold} or higher.
==============`;
    }
  } catch (error: any) {
    logger.error(
      `Reranking failed for user message: ${userMessage}. Error: ${error.message}`
    );
    throw error;
  }
}
