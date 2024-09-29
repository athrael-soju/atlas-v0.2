import { AssistantMode } from '@/types/settings';

export const defaultUserSettings = () => ({
  forge: {
    parsingProvider: 'iol',
    minChunkSize: 0,
    maxChunkSize: 512,
    chunkOverlap: 0,
    partitioningStrategy: 'fast',
    chunkingStrategy: 'basic'
  },
  knowledgebase: {
    cohereTopN: 10,
    cohereRelevanceThreshold: 0,
    pineconeTopK: 100
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
