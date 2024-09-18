'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormSlider } from '@/components/form-slider';
import { forgeFormSchema, ForgeFormValues } from '@/lib/form-schema';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { FormSelect } from '@/components/form-select';
import {
  parsingProviders,
  partitioningStrategies,
  chunkingStrategies,
  partitioningStrategyDescriptions,
  chunkingStrategyDescriptions
} from '@/constants/forge';
import { Searching } from '@/components/spinner';

const defaultValues: Partial<ForgeFormValues> = {
  parsingProvider: 'io',
  partitioningStrategy: 'fast',
  chunkingStrategy: 'basic',
  minChunkSize: 0,
  maxChunkSize: 512,
  chunkOverlap: 0,
  chunkBatch: 50
};

export function ForgeForm() {
  const { form, loading, onSubmit } = useFetchAndSubmit<ForgeFormValues>({
    schema: forgeFormSchema,
    defaultValues,
    formPath: 'settings.forge'
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormSelect
            label="Provider"
            options={parsingProviders}
            value={form.watch('parsingProvider')}
            onChange={(val) => form.setValue('parsingProvider', val)}
            placeholder="Select provider"
            description="Select parsing provider"
          />

          <FormSelect
            label="Partitioning Strategy"
            options={partitioningStrategies}
            value={form.watch('partitioningStrategy')}
            onChange={(val) => form.setValue('partitioningStrategy', val)}
            placeholder="Select strategy"
            description={
              partitioningStrategyDescriptions[
                form.watch(
                  'partitioningStrategy'
                ) as keyof typeof partitioningStrategyDescriptions
              ]
            }
          />

          <FormSelect
            label="Chunking Strategy"
            options={chunkingStrategies}
            value={form.watch('chunkingStrategy')}
            onChange={(val) => form.setValue('chunkingStrategy', val)}
            placeholder="Select strategy"
            description={
              chunkingStrategyDescriptions[
                form.watch(
                  'chunkingStrategy'
                ) as keyof typeof chunkingStrategyDescriptions
              ]
            }
          />
        </div>

        <FormSlider
          label="Min Chunk Size"
          value={form.watch('minChunkSize')}
          onChange={(val) => form.setValue('minChunkSize', val)}
          min={0}
          max={1024}
          step={256}
          description="Set the minimum chunk size (0-1024)"
        />

        <FormSlider
          label="Max Chunk Size"
          value={form.watch('maxChunkSize')}
          onChange={(val) => form.setValue('maxChunkSize', val)}
          min={0}
          max={1024}
          step={256}
          description="Set the maximum chunk size (0-1024)"
        />

        <FormSlider
          label="Chunk Overlap"
          value={form.watch('chunkOverlap')}
          onChange={(val) => form.setValue('chunkOverlap', val)}
          min={0}
          max={256}
          step={1}
          description="Set the chunk overlap (0-256)"
        />

        <FormSlider
          label="Chunk Batch"
          value={form.watch('chunkBatch')}
          onChange={(val) => form.setValue('chunkBatch', val)}
          min={50}
          max={150}
          step={50}
          description="Set the chunk batch (50-150)"
        />

        <Button type="submit" style={{ width: '100%' }}>
          Update settings
        </Button>
      </form>
    </Form>
  );
}
