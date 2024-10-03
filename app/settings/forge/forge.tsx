'use client';

import { useState, useMemo, useEffect } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ForgeFormSkeleton } from './skeleton';

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

  const [saving, setSaving] = useState(false);

  const selectedParsingProvider = form.watch('parsingProvider');
  const selectedChunkingStrategy = form.watch('chunkingStrategy');

  // Filter chunking strategies based on the selected parsing provider
  const filteredChunkingStrategies = useMemo(() => {
    const isServerlessProvider = parsingProviders.find(
      (provider) => provider.value === selectedParsingProvider
    )?.serverless;

    // Show all non-serverless strategies, and show serverless-only strategies when the provider is serverless
    return chunkingStrategies.filter(
      (strategy) => !strategy.serverlessOnly || isServerlessProvider
    );
  }, [selectedParsingProvider]);

  // Check if the selected chunking strategy is valid whenever the provider changes
  useEffect(() => {
    const isStrategyValid = filteredChunkingStrategies.some(
      (strategy) => strategy.value === selectedChunkingStrategy
    );

    if (!isStrategyValid) {
      // If the current strategy is no longer valid, set it to the first available strategy
      form.setValue(
        'chunkingStrategy',
        filteredChunkingStrategies[0]?.value || ''
      );
    }
  }, [filteredChunkingStrategies, selectedChunkingStrategy, form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      onSubmit(form.getValues() as ForgeFormValues);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ForgeFormSkeleton />; // Use the skeleton component during loading
  }

  return (
    <div className="container mx-auto space-y-8 py-10">
      <Tabs defaultValue="processing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="processing">Document Processing</TabsTrigger>
          <TabsTrigger value="vectorization">Vectorization</TabsTrigger>
        </TabsList>

        <TabsContent value="processing" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <SettingCard
              icon={<FileText className="h-6 w-6" />}
              title="Document Processing"
              description="Configure document ingestion settings"
            >
              <Select
                value={form.watch('parsingProvider')}
                onValueChange={(val) => form.setValue('parsingProvider', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parsing provider" />
                </SelectTrigger>
                <SelectContent>
                  {parsingProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  parsingProviderDescriptions[
                    form.watch(
                      'parsingProvider'
                    ) as keyof typeof parsingProviderDescriptions
                  ]
                }
              </p>
            </SettingCard>

            <SettingCard
              icon={<Database className="h-6 w-6" />}
              title="Partitioning Strategy"
              description="Choose the strategy for document partitioning"
            >
              <Select
                value={form.watch('partitioningStrategy')}
                onValueChange={(val) =>
                  form.setValue('partitioningStrategy', val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select partitioning strategy" />
                </SelectTrigger>
                <SelectContent>
                  {partitioningStrategies.map((strategy) => (
                    <SelectItem key={strategy.value} value={strategy.value}>
                      {strategy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  partitioningStrategyDescriptions[
                    form.watch(
                      'partitioningStrategy'
                    ) as keyof typeof partitioningStrategyDescriptions
                  ]
                }
              </p>
            </SettingCard>

            <SettingCard
              icon={<Settings className="h-6 w-6" />}
              title="Chunking Strategy"
              description="Set chunking parameters for your documents"
            >
              <Select
                value={form.watch('chunkingStrategy')}
                onValueChange={(val) => form.setValue('chunkingStrategy', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chunking strategy" />
                </SelectTrigger>
                <SelectContent>
                  {filteredChunkingStrategies.map((strategy) => (
                    <SelectItem key={strategy.value} value={strategy.value}>
                      {strategy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  chunkingStrategyDescriptions[
                    form.watch(
                      'chunkingStrategy'
                    ) as keyof typeof chunkingStrategyDescriptions
                  ]
                }
              </p>
            </SettingCard>

            <SettingCard
              icon={<Settings className="h-6 w-6" />}
              title="Min Chunk Size"
              description="Define the minimum chunk size for processing"
            >
              <Slider
                value={[form.watch('minChunkSize')]}
                min={0}
                max={1024}
                step={256}
                onValueChange={([val]) => form.setValue('minChunkSize', val)}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Minimum tokens per chunk size: {form.watch('minChunkSize')}
              </p>
            </SettingCard>

            <SettingCard
              icon={<Settings className="h-6 w-6" />}
              title="Max Chunk Size"
              description="Define the maximum chunk size for processing"
            >
              <Slider
                value={[form.watch('maxChunkSize')]}
                min={0}
                max={1024}
                step={256}
                onValueChange={([val]) => form.setValue('maxChunkSize', val)}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Maximum tokens per chunk size: {form.watch('maxChunkSize')}
              </p>
            </SettingCard>

            <SettingCard
              icon={<Settings className="h-6 w-6" />}
              title="Chunk Overlap"
              description="Set the chunk overlap for document partitioning"
            >
              <Slider
                value={[form.watch('chunkOverlap')]}
                min={0}
                max={256}
                step={1}
                onValueChange={([val]) => form.setValue('chunkOverlap', val)}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Tokens overlap: {form.watch('chunkOverlap')}
              </p>
            </SettingCard>
          </div>
        </TabsContent>

        <TabsContent value="vectorization" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <SettingCard
              icon={<Cpu className="h-6 w-6" />}
              title="Vectorization Provider"
              description="Select and configure the vectorization provider"
            >
              <Select
                value={form.watch('vectorizationProvider')}
                onValueChange={(val) =>
                  form.setValue('vectorizationProvider', val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vectorization provider" />
                </SelectTrigger>
                <SelectContent>
                  {vectorizationProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  vectorizationProviderDescriptions[
                    form.watch(
                      'vectorizationProvider'
                    ) as keyof typeof vectorizationProviderDescriptions
                  ]
                }
              </p>
            </SettingCard>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function SettingCard({
  icon,
  title,
  description,
  children
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
