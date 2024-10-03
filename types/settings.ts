import { Conversation } from './data';

export interface ForgeSettings {
  vectorizationProvider: string;
  parsingProvider: string;
  partitioningStrategy: string;
  chunkingStrategy: string;
  minChunkSize: number;
  maxChunkSize: number;
  chunkOverlap: number;
}

export interface Embedding {
  id: string;
  values: number[];
  metadata: {
    text: any;
    userId: string;
  };
}

export interface ParsedElement {
  [k: string]: any;
}

export interface KnowledgebaseSettings {
  rerankTopN: number;
  cohereRelevanceThreshold: number;
  pineconeTopK: number;
}
export enum AssistantMode {
  Knowledgebase = 'Knowledgebase',
  Analysis = 'Analysis'
}

export interface ChatSettings {
  assistantMode: AssistantMode;
}

export interface ProfileSettings {
  firstName?: string;
  lastName?: string;
  email?: string;
  countryOfOrigin?: string;
  preferredLanguage: string;
  personalizedResponses: boolean;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  technicalAptitude?: string;
  militaryStatus?: string;
}

export interface MiscSettings {
  sidebarExpanded: boolean;
}

export interface ConversationSettings {
  activeConversationId: string;
  conversations: Conversation[];
}
