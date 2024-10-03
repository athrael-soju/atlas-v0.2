import { RerankResponseResultsItem } from 'cohere-ai/api/types';
import { cohere, model } from '@/lib/client/cohere';
import { KnowledgebaseSettings } from '@/types/settings';
import { formatFilteredResults } from '@/lib/utils';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';

// Function to filter the results based on the relevance score threshold
function filterResults(
  results: RerankResponseResultsItem[],
  relevanceThreshold: number
): RerankResponseResultsItem[] {
  logger.info(
    chalk.blue(
      `Filtering results with relevance score >= ${relevanceThreshold}. Total results: ${results.length}`
    )
  );
  const filteredResults = results.filter(
    (result) => result.relevanceScore >= relevanceThreshold
  );
  logger.info(
    chalk.green(
      `Filtered results count: ${filteredResults.length} (Threshold: ${relevanceThreshold})`
    )
  );
  return filteredResults;
}

// Main function to rerank and handle the response
export async function rerank(
  userMessage: string,
  queryResults: any[],
  knowledgebaseSettings: KnowledgebaseSettings
): Promise<string> {
  try {
    logger.info(
      chalk.blue(`Starting reranking process for user message: ${userMessage}`)
    );

    const rerankResponse = await cohere.rerank({
      model: model,
      documents: queryResults,
      rankFields: ['text', 'filename', 'page_number', 'filetype', 'languages'],
      query: userMessage,
      topN: knowledgebaseSettings.rerankTopN,
      returnDocuments: true
    });

    logger.info(chalk.green(`Reranking completed. Processing results...`));

    const filteredResults = filterResults(
      rerankResponse.results,
      knowledgebaseSettings.cohereRelevanceThreshold
    );

    if (filteredResults.length > 0) {
      logger.info(
        chalk.green(
          `Found ${filteredResults.length} relevant documents after filtering.`
        )
      );
      let formattedResults = formatFilteredResults(filteredResults);
      return formattedResults;
    } else {
      logger.warn(
        chalk.yellow(
          `No relevant documents found with a relevance score of ${knowledgebaseSettings.cohereRelevanceThreshold} or higher.`
        )
      );
      return `
==============
Context: No relevant documents found with a relevance score of ${knowledgebaseSettings.cohereRelevanceThreshold} or higher.
==============`;
    }
  } catch (error: any) {
    logger.error(
      chalk.red(
        `Reranking failed for user message: ${userMessage}. Error: ${error.message}`
      )
    );
    throw error;
  }
}
