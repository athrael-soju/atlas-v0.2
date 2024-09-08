export const parsingProviders = [
  { label: 'Unstructured.io', value: 'io' }
] as const;
export const partitioningStrategies = [
  { label: 'Fast', value: 'fast' },
  { label: 'Hi Res', value: 'hi_res' },
  { label: 'Auto', value: 'auto' },
  { label: 'OCR Only', value: 'ocr_only' }
] as const;
export const chunkingStrategies = [
  { label: 'Basic', value: 'basic' },
  { label: 'By Title', value: 'by_title' },
  { label: 'By Page', value: 'by_page' },
  { label: 'By Similarity', value: 'by_similarity' }
] as const;

export const partitioningStrategyDescriptions = {
  fast: 'The “rule-based” strategy quickly pulls all text elements using traditional NLP extraction techniques. It is not recommended for image-based file types.',
  hi_res:
    'The “model-based” strategy uses document layout for additional information, making it ideal for use cases needing accurate classification of document elements.',
  auto: 'The “auto” strategy selects the best partitioning approach based on document characteristics and function parameters.',
  ocr_only:
    'A “model-based” strategy that uses Optical Character Recognition to extract text from image-based files.'
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
