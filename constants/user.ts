export const defaultUserSettings = {
  forge: {
    parsingProvider: 'io',
    minChunkSize: 0,
    maxChunkSize: 512,
    chunkOverlap: 0,
    chunkBatch: 50,
    partitioningStrategy: 'fast',
    chunkingStrategy: 'basic'
  },
  knowledgebase: {
    cohereTopN: 10,
    cohereRelevanceThreshold: 50,
    pineconeTopK: 100
  },
  chat: {
    knowledgebaseEnabled: false
  },
  profile: {
    preferredLanguage: 'en_US',
    personalizedResponses: false
  },
  misc: {
    sidebarExpanded: true
  }
};
