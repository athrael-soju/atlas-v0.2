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
    cohereRelevanceThreshold: 0,
    pineconeTopK: 100
  },
  chat: {
    knowledgebaseEnabled: false
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
};
