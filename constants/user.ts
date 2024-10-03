import { AssistantMode } from '@/types/settings';

export const defaultUserSettings = () => ({
  forge: {
    parsingProvider: 'iol',
    vectorizationProvider: 'pcs',
    minChunkSize: 0,
    maxChunkSize: 512,
    chunkOverlap: 0,
    partitioningStrategy: 'fast',
    chunkingStrategy: 'basic'
  },
  knowledgebase: {
    rerankTopN: 10,
    cohereRelevanceThreshold: 0,
    vectorDbTopK: 100
  },
  chat: {
    assistantMode: AssistantMode.Analysis
  },
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    preferredLanguage: 'en_US',
    personalizedResponses: false
  },
  misc: {
    sidebarExpanded: true
  }
});
