import * as z from 'zod';

export const profileFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  countryOfOrigin: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  preferredLanguage: z.string(),
  personalizedResponses: z.boolean(),
  dateOfBirth: z.string().optional(),
  technicalAptitude: z.string().optional(),
  militaryStatus: z.string().optional()
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const forgeFormSchema = z
  .object({
    parsingProvider: z.string({
      required_error: 'Please select a Parsing provider.'
    }),
    vectorizationProvider: z.string({
      required_error: 'Please select a Vectorization provider.'
    }),
    minChunkSize: z.number().min(0).max(1024).step(256),
    maxChunkSize: z.number().min(0).max(1024).step(256),
    chunkOverlap: z.number().min(0).max(256).step(1),
    partitioningStrategy: z.string({
      required_error: 'Please select a partitioning strategy.'
    }),
    chunkingStrategy: z.string({
      required_error: 'Please select a chunking strategy.'
    })
  })
  .refine((data) => data.minChunkSize <= data.maxChunkSize, {
    message: 'Max chunk size cannot be smaller than min chunk size.',
    path: ['maxChunkSize']
  });

export type ForgeFormValues = z.infer<typeof forgeFormSchema>;

export const knowledgebaseSchema = z.object({
  rerankTopN: z.number().min(1).max(100).step(1),
  cohereRelevanceThreshold: z.number().min(0).max(100).step(5),
  pineconeTopK: z.number().min(100).max(1000).step(100)
});

export type KnowledgebaseValues = z.infer<typeof knowledgebaseSchema>;

export const chatFormSchema = z.object({
  assistantMode: z.enum(['Knowledgebase', 'Analysis'])
});

export type ChatFormValues = z.infer<typeof chatFormSchema>;

export const sidebarSettingsSchema = z.object({
  sidebarExpanded: z.boolean()
});

export type SidebarSettingsValues = z.infer<typeof sidebarSettingsSchema>;

const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  active: z.boolean()
});

// Define the form schema
export const conversationsFormSchema = z.object({
  conversations: z.array(conversationSchema),
  activeConversationId: z.string().optional()
});

// Type inference for form data
export type ConversationsFormValues = z.infer<typeof conversationsFormSchema>;

export const assistantFileSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  bytes: z.number(),
  filename: z.string(),
  isActive: z.boolean()
});

export const assistantFilesFormSchema = z.object({
  analysis: z.array(assistantFileSchema)
});

export type AssistantFilesFormValues = z.infer<typeof assistantFilesFormSchema>;
