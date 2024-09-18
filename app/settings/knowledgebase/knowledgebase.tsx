'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormSlider } from '@/components/form-slider';
import { knowledgebaseSchema, KnowledgebaseValues } from '@/lib/form-schema';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { Searching } from '@/components/spinner';

const defaultValues: Partial<KnowledgebaseValues> = {
  cohereTopN: 10,
  cohereRelevanceThreshold: 0,
  pineconeTopK: 100
};

export function KnowledgebaseForm() {
  const { form, loading, onSubmit } = useFetchAndSubmit<KnowledgebaseValues>({
    schema: knowledgebaseSchema,
    defaultValues,
    formPath: 'settings.knowledgebase'
  });

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <Searching />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormSlider
          label="Cohere Top N"
          value={form.watch('cohereTopN')}
          onChange={(val) => form.setValue('cohereTopN', val)}
          min={1}
          max={100}
          step={1}
          description="Set the top N results to consider (1-100)"
        />

        <FormSlider
          label="Cohere Relevance Threshold"
          value={form.watch('cohereRelevanceThreshold')}
          onChange={(val) => form.setValue('cohereRelevanceThreshold', val)}
          min={0}
          max={100}
          step={5}
          description="Set the relevance threshold (0-100)"
        />

        <FormSlider
          label="Pinecone Top K"
          value={form.watch('pineconeTopK')}
          onChange={(val) => form.setValue('pineconeTopK', val)}
          min={100}
          max={1000}
          step={100}
          description="Set the top K results to retrieve (100-1000)"
        />

        <Button type="submit" style={{ width: '100%' }}>
          Update settings
        </Button>
      </form>
    </Form>
  );
}
