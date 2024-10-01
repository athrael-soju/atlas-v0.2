export const parsingProviders = [
  { label: 'Unstructured.io (Serverless)', value: 'ioc' },
  { label: 'Unstructured.io (Local)', value: 'iol' }
] as const;

export const vectorizationProviders = [
  { label: 'Pinecone (Serverless)', value: 'pcs' },
  { label: 'Qdrant (Local)', value: 'qdl' }
] as const;

export const partitioningStrategies = [
  { label: 'Fast', value: 'fast' },
  { label: 'Hi Res', value: 'hi_res' },
  { label: 'Auto', value: 'auto' },
  { label: 'OCR Only', value: 'ocr_only' }
] as const;

export const chunkingStrategies = [
  { label: 'Basic', value: 'basic', serverlessOnly: false },
  { label: 'By Title', value: 'by_title', serverlessOnly: false },
  { label: 'By Page', value: 'by_page', serverlessOnly: true },
  { label: 'By Similarity', value: 'by_similarity', serverlessOnly: true }
] as const;

export const partitioningStrategyDescriptions = {
  fast: 'The “rule-based” strategy quickly pulls all text elements using traditional NLP extraction techniques. It is not recommended for image-based file types.',
  hi_res:
    'The “model-based” strategy uses document layout for additional information, making it ideal for use cases needing accurate classification of document elements.',
  auto: 'The “auto” strategy selects the best partitioning approach based on document characteristics and function parameters.',
  ocr_only:
    'A “model-based” strategy that uses Optical Character Recognition to extract text from image-based files.'
};
export const parsingProviderDescriptions = {
  ioc: 'Unstructured.io serverless  uses a cloud-based service to extract text from documents.',
  iol: 'Unstructured.io open source  uses a local service to extract text from documents.'
};
export const vectorizationProviderDescriptions = {
  pcs: 'Pinecone is a serverless vectorization provider that uses a cloud-based service to convert text into vectors.',
  qdl: 'Qdrant is a local vectorization provider that uses a local service to convert text into vectors.'
};

export const chunkingStrategyDescriptions = {
  basic:
    'Combines sequential elements to fill chunks while respecting max_characters (hard-max) and new_after_n_chars (soft-max) values.',
  by_title:
    'Preserves section boundaries, ensuring each chunk contains text from only one section, optionally considering page boundaries.',
  by_page:
    'Ensures content from different pages remains separate, starting a new chunk when a new page is detected.',
  by_similarity:
    'Uses the sentence-transformers/multi-qa-mpnet-base-dot-v1 model to group topically similar sequential elements into chunks.'
};
