import * as z from 'zod';

export const profileFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  contactNumber: z.coerce.number().optional(),
  countryOfOrigin: z.string().optional(),
  preferredLanguage: z.string(),
  personalizedResponses: z.boolean(),
  dateOfBirth: z.string().optional(),
  technicalAptitude: z.string().optional()
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const forgeFormSchema = z
  .object({
    parsingProvider: z.string({
      required_error: 'Please select a Parsing provider.'
    }),
    minChunkSize: z.number().min(0).max(1024).step(256),
    maxChunkSize: z.number().min(0).max(1024).step(256),
    chunkOverlap: z.number().min(0).max(256).step(1),
    chunkBatch: z.number().min(50).max(150).step(50),
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
  cohereTopN: z.number().min(1).max(100).step(1),
  cohereRelevanceThreshold: z.number().min(0).max(100).step(5),
  pineconeTopK: z.number().min(100).max(1000).step(100)
});

export type KnowledgebaseValues = z.infer<typeof knowledgebaseSchema>;

export const chatFormSchema = z.object({
  knowledgebaseEnabled: z.boolean()
});

export type ChatFormValues = z.infer<typeof chatFormSchema>;

export const sidebarSettingsSchema = z.object({
  sidebarExpanded: z.boolean()
});

export type SidebarSettingsValues = z.infer<typeof sidebarSettingsSchema>;
