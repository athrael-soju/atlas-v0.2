'use client';

import { useState } from 'react';
import { FileText, Cpu, Database, Settings } from 'lucide-react';
import { forgeFormSchema, ForgeFormValues } from '@/lib/form-schema';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  parsingProviders,
  vectorizationProviders,
  partitioningStrategies,
  chunkingStrategies,
  partitioningStrategyDescriptions,
  parsingProviderDescriptions,
  vectorizationProviderDescriptions,
  chunkingStrategyDescriptions
} from '@/constants/forge';
import { SettingCard } from '../card';
import { SelectSetting } from '../select';
import { SliderSetting } from '../slider';
import { Searching } from '@/components/spinner';
import { Button } from '@/components/ui/button'; // Import the ShadCN button

const defaultValues: Partial<ForgeFormValues> = {
  parsingProvider: 'iol',
  vectorizationProvider: 'pcs',
  partitioningStrategy: 'fast',
  chunkingStrategy: 'basic',
  minChunkSize: 0,
  maxChunkSize: 512,
  chunkOverlap: 0
};

export function ForgeForm() {
  const { form, loading, onSubmit } = useFetchAndSubmit<ForgeFormValues>({
    schema: forgeFormSchema,
    defaultValues,
    formPath: 'settings.forge'
  });

  const [saving, setSaving] = useState(false); // Track the saving state

  // Handle form submission on button click
  const handleSave = async () => {
    setSaving(true);
    try {
      onSubmit(form.getValues() as ForgeFormValues); // Get form values and submit
    } finally {
      setSaving(false); // Reset saving state after submission
    }
  };

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Searching />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="processing">
        <TabsList>
          <TabsTrigger value="processing">Document Processing</TabsTrigger>
          <TabsTrigger value="vectorization">Vectorization</TabsTrigger>
        </TabsList>

        <TabsContent value="processing">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <SettingCard
              icon={<FileText className="h-8 w-8 text-primary" />}
              title="Document Processing"
              description="Configure document ingestion settings"
            >
              <SelectSetting
                value={form.watch('parsingProvider')}
                options={[...parsingProviders]}
                description={
                  parsingProviderDescriptions[
                    form.watch(
                      'parsingProvider'
                    ) as keyof typeof parsingProviderDescriptions
                  ]
                }
                onValueChange={(val) => form.setValue('parsingProvider', val)}
              />
            </SettingCard>

            <SettingCard
              icon={<Database className="h-8 w-8 text-primary" />}
              title="Partitioning Strategy"
              description="Choose the strategy for document partitioning"
            >
              <SelectSetting
                value={form.watch('partitioningStrategy')}
                options={[...partitioningStrategies]}
                description={
                  partitioningStrategyDescriptions[
                    form.watch(
                      'partitioningStrategy'
                    ) as keyof typeof partitioningStrategyDescriptions
                  ]
                }
                onValueChange={(val) =>
                  form.setValue('partitioningStrategy', val)
                }
              />
            </SettingCard>

            <SettingCard
              icon={<Settings className="h-8 w-8 text-primary" />}
              title="Chunking Strategy"
              description="Set chunking parameters for your documents"
            >
              <SelectSetting
                value={form.watch('chunkingStrategy')}
                options={[...chunkingStrategies]}
                description={
                  chunkingStrategyDescriptions[
                    form.watch(
                      'chunkingStrategy'
                    ) as keyof typeof chunkingStrategyDescriptions
                  ]
                }
                onValueChange={(val) => form.setValue('chunkingStrategy', val)}
              />
            </SettingCard>

            <SettingCard
              icon={<Settings className="h-8 w-8 text-primary" />}
              title="Min Chunk Size"
              description="Define the minimum chunk size for processing"
            >
              <SliderSetting
                label="Min Chunk Size"
                value={form.watch('minChunkSize')}
                min={0}
                max={1024}
                step={256}
                onValueChange={(val) => form.setValue('minChunkSize', val)}
                description="Minimum tokens per chunk size"
              />
            </SettingCard>

            <SettingCard
              icon={<Settings className="h-8 w-8 text-primary" />}
              title="Max Chunk Size"
              description="Define the maximum chunk size for processing"
            >
              <SliderSetting
                label="Max Chunk Size"
                value={form.watch('maxChunkSize')}
                min={0}
                max={1024}
                step={256}
                onValueChange={(val) => form.setValue('maxChunkSize', val)}
                description="Maximum tokens per chunk size"
              />
            </SettingCard>

            <SettingCard
              icon={<Settings className="h-8 w-8 text-primary" />}
              title="Chunk Overlap"
              description="Set the chunk overlap for document partitioning"
            >
              <SliderSetting
                label="Chunk Overlap"
                value={form.watch('chunkOverlap')}
                min={0}
                max={256}
                step={1}
                onValueChange={(val) => form.setValue('chunkOverlap', val)}
                description="Tokens overlap"
              />
            </SettingCard>
          </div>
        </TabsContent>

        <TabsContent value="vectorization">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SettingCard
              icon={<Cpu className="h-8 w-8 text-primary" />}
              title="Vectorization Provider"
              description="Select and configure the vectorization provider"
            >
              <SelectSetting
                value={form.watch('vectorizationProvider')}
                options={[...vectorizationProviders]}
                description={
                  vectorizationProviderDescriptions[
                    form.watch(
                      'vectorizationProvider'
                    ) as keyof typeof vectorizationProviderDescriptions
                  ]
                }
                onValueChange={(val) =>
                  form.setValue('vectorizationProvider', val)
                }
              />
            </SettingCard>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleSave}
          className="w-full"
          variant="default"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
