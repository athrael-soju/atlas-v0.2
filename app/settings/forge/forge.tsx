'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Form, FormField } from '@/components/ui/form';
import { Searching } from '@/components/spinner';
import { forgeFormSchema, ForgeFormValues } from '@/lib/form-schema';
import { IUser } from '@/models/User';
import {
  parsingProviders,
  partitioningStrategies,
  chunkingStrategies,
  partitioningStrategyDescriptions,
  chunkingStrategyDescriptions
} from '@/constants/forge';
import { FormSelect } from '@/components/form-select';
import { FormSlider } from '@/components/form-slider';

const defaultValues: Partial<ForgeFormValues> = {
  parsingProvider: 'io',
  partitioningStrategy: 'fast',
  chunkingStrategy: 'basic',
  minChunkSize: 0,
  maxChunkSize: 512,
  chunkOverlap: 0,
  chunkBatch: 50
};

// ButtonLoading Component to show loading spinner
export function ButtonLoading() {
  return (
    <Button disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Please wait
    </Button>
  );
}

export function ForgeForm() {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const form = useForm<ForgeFormValues>({
    resolver: zodResolver(forgeFormSchema),
    defaultValues
  });

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/user', { method: 'GET' });
          if (response.ok) {
            const result = await response.json();
            if (result?.settings?.forge) {
              form.reset(result.settings.forge);
            } else {
              form.reset(defaultValues);
            }
          } else {
            toast({
              title: 'Error',
              description: 'Request failed. Please try again.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: `${error}`,
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [form, userId]);

  async function onSubmit(data: ForgeFormValues) {
    const partialData: Partial<IUser> = { settings: { forge: data } };
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialData.settings)
      });

      if (response.ok) {
        toast({
          title: 'Settings Updated',
          description: 'Your settings have been successfully updated.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Request failed. Please try again.',
          variant: 'destructive'
        });
        form.reset(defaultValues);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  }

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
          <FormField
            control={form.control}
            name="parsingProvider"
            render={({ field }) => (
              <FormSelect
                label="Provider"
                options={parsingProviders}
                value={field.value}
                onChange={(val) => form.setValue('parsingProvider', val)}
                placeholder="Select provider"
                description="The Unstructured Serverless API provides efficient, secure, and scalable data processing for AI applications with high performance, cost-effective per-page pricing, and enhanced developer experience."
              />
            )}
          />

          <FormField
            control={form.control}
            name="partitioningStrategy"
            render={({ field }) => (
              <FormSelect
                label="Partitioning Strategy"
                options={partitioningStrategies}
                value={field.value}
                onChange={(val) => form.setValue('partitioningStrategy', val)}
                placeholder="Select strategy"
                description={
                  partitioningStrategyDescriptions[
                    field.value as keyof typeof partitioningStrategyDescriptions
                  ]
                }
              />
            )}
          />

          <FormField
            control={form.control}
            name="chunkingStrategy"
            render={({ field }) => (
              <FormSelect
                label="Chunking Strategy"
                options={chunkingStrategies}
                value={field.value}
                onChange={(val) => form.setValue('chunkingStrategy', val)}
                placeholder="Select strategy"
                description={
                  chunkingStrategyDescriptions[
                    field.value as keyof typeof chunkingStrategyDescriptions
                  ]
                }
              />
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="minChunkSize"
          render={({ field }) => (
            <FormSlider
              label="Min Chunk Size"
              value={field.value}
              onChange={(val) => form.setValue('minChunkSize', val)}
              min={0}
              max={1024}
              step={256}
              description="Set the minimum chunk size (0-1024)"
            />
          )}
        />

        <FormField
          control={form.control}
          name="maxChunkSize"
          render={({ field }) => (
            <FormSlider
              label="Max Chunk Size"
              value={field.value}
              onChange={(val) => form.setValue('maxChunkSize', val)}
              min={0}
              max={1024}
              step={256}
              description="Set the maximum chunk size (0-1024). Cannot be smaller than min chunk size."
            />
          )}
        />

        <FormField
          control={form.control}
          name="chunkOverlap"
          render={({ field }) => (
            <FormSlider
              label="Chunk Overlap"
              value={field.value}
              onChange={(val) => form.setValue('chunkOverlap', val)}
              min={0}
              max={256}
              step={1}
              description="Set the chunk overlap (0-256)"
            />
          )}
        />

        <FormField
          control={form.control}
          name="chunkBatch"
          render={({ field }) => (
            <FormSlider
              label="Chunk Batch"
              value={field.value}
              onChange={(val) => form.setValue('chunkBatch', val)}
              min={50}
              max={150}
              step={50}
              description="Set the chunk batch (50-150)"
            />
          )}
        />

        {loading ? (
          <ButtonLoading />
        ) : (
          <Button type="submit" style={{ width: '100%' }}>
            Update settings
          </Button>
        )}
      </form>
    </Form>
  );
}
