import * as z from 'zod';

export const profileSchema = z.object({
  firstname: z
    .string()
    .min(3, { message: 'Product Name must be at least 3 characters' }),
  lastname: z
    .string()
    .min(3, { message: 'Product Name must be at least 3 characters' }),
  email: z
    .string()
    .email({ message: 'Product Name must be at least 3 characters' }),
  contactno: z.coerce.number(),
  country: z.string().min(1, { message: 'Please select a category' }),
  language: z.string().min(1, { message: 'Please select a category' }),
  // jobs array is for the dynamic fields
  jobs: z.array(
    z.object({
      jobcountry: z.string().min(1, { message: 'Please select a category' }),
      joblanguage: z.string().min(1, { message: 'Please select a category' }),
      jobtitle: z
        .string()
        .min(3, { message: 'Product Name must be at least 3 characters' }),
      employer: z
        .string()
        .min(3, { message: 'Product Name must be at least 3 characters' }),
      startdate: z
        .string()
        .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
          message: 'Start date should be in the format YYYY-MM-DD'
        }),
      enddate: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: 'End date should be in the format YYYY-MM-DD'
      })
    })
  )
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

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
