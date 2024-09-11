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
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    contactNumber: undefined,
    countryOfOrigin: undefined,
    preferredLanguage: 'en_US',
    personalizedResponses: false,
    dateOfBirth: undefined,
    technicalAptitude: undefined
  },
  misc: {
    sidebarExpanded: true
  }
};
