// app/dashboard/forge/forge.tsx
'use client';

import { z } from 'zod';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Searching } from '@/components/spinner';

import { IUser } from '@/models/User';

const forgeFormSchema = z
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

type ForgeFormValues = z.infer<typeof forgeFormSchema>;

const defaultValues: Partial<ForgeFormValues> = {
  parsingProvider: 'io',
  partitioningStrategy: 'fast',
  chunkingStrategy: 'basic',
  minChunkSize: 0,
  maxChunkSize: 1024,
  chunkOverlap: 0,
  chunkBatch: 50
};

const parsingProviders = [{ label: 'Unstructured.io', value: 'io' }] as const;
const partitioningStrategies = [
  { label: 'Fast', value: 'fast' },
  { label: 'Hi Res', value: 'hi_res' },
  { label: 'Auto', value: 'auto' },
  { label: 'OCR Only', value: 'ocr_only' }
] as const;
const chunkingStrategies = [
  { label: 'Basic', value: 'basic' },
  { label: 'By Title', value: 'by_title' },
  { label: 'By Page', value: 'by_page' },
  { label: 'By Similarity', value: 'by_similarity' }
] as const;

const partitioningStrategyDescriptions = {
  fast: 'The “rule-based” strategy quickly pulls all text elements using traditional NLP extraction techniques. It is not recommended for image-based file types.',
  hi_res:
    'The “model-based” strategy uses document layout for additional information, making it ideal for use cases needing accurate classification of document elements.',
  auto: 'The “auto” strategy selects the best partitioning approach based on document characteristics and function parameters.',
  ocr_only:
    'A “model-based” strategy that uses Optical Character Recognition to extract text from image-based files.'
};

const chunkingStrategyDescriptions = {
  basic:
    'Combines sequential elements to fill chunks while respecting max_characters (hard-max) and new_after_n_chars (soft-max) values.',
  by_title:
    'Preserves section boundaries, ensuring each chunk contains text from only one section, optionally considering page boundaries.',
  by_page:
    'Ensures content from different pages remains separate, starting a new chunk when a new page is detected.',
  by_similarity:
    'Uses the sentence-transformers/multi-qa-mpnet-base-dot-v1 model to group topically similar sequential elements into chunks.'
};

export function ForgeForm() {
  const { data: session } = useSession();
  const user = session?.user;
  const userEmail = user?.email;
  const [loading, setLoading] = useState(true);
  const form = useForm<ForgeFormValues>({
    resolver: zodResolver(forgeFormSchema),
    defaultValues
  });

  // Fetch user settings from the database on mount
  useEffect(() => {
    if (userEmail) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/user', {
            method: 'GET'
          });

          if (response.ok) {
            const result = await response.json();
            if (result?.user?.settings?.forge) {
              form.reset(result.user.settings.forge);
            }
          } else {
            console.error('Failed to fetch user settings');
          }
        } catch (error) {
          console.error('Error fetching user settings:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [form, userEmail]);

  async function onSubmit(data: ForgeFormValues) {
    const partialData: Partial<IUser> = {
      settings: { forge: data }
    };

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
          description: 'Failed to update settings. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
      console.error('Failed to update settings:', error);
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
              <FormItem
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <FormLabel>Provider</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[200px] justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? parsingProviders.find(
                              (provider) => provider.value === field.value
                            )?.label
                          : 'Select provider'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search provider..." />
                      <CommandList>
                        <CommandEmpty>No provider found.</CommandEmpty>
                        <CommandGroup>
                          {parsingProviders.map((provider) => (
                            <CommandItem
                              value={provider.label}
                              key={provider.value}
                              onSelect={() => {
                                form.setValue(
                                  'parsingProvider',
                                  provider.value
                                );
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  provider.value === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {provider.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The Unstructured Serverless API provides efficient, secure,
                  and scalable data processing for AI applications with high
                  performance, cost-effective per-page pricing, and enhanced
                  developer experience.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="partitioningStrategy"
            render={({ field }) => (
              <FormItem
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <FormLabel>Partitioning Strategy</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[200px] justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? partitioningStrategies.find(
                              (strategy) => strategy.value === field.value
                            )?.label
                          : 'Select strategy'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search strategy..." />
                      <CommandList>
                        <CommandEmpty>No strategy found.</CommandEmpty>
                        <CommandGroup>
                          {partitioningStrategies.map((strategy) => (
                            <CommandItem
                              value={strategy.label}
                              key={strategy.value}
                              onSelect={() => {
                                form.setValue(
                                  'partitioningStrategy',
                                  strategy.value
                                );
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  strategy.value === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {strategy.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {
                    partitioningStrategyDescriptions[
                      field.value as keyof typeof partitioningStrategyDescriptions
                    ]
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chunkingStrategy"
            render={({ field }) => (
              <FormItem
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <FormLabel>Chunking Strategy</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[200px] justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? chunkingStrategies.find(
                              (strategy) => strategy.value === field.value
                            )?.label
                          : 'Select strategy'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search strategy..." />
                      <CommandList>
                        <CommandEmpty>No strategy found.</CommandEmpty>
                        <CommandGroup>
                          {chunkingStrategies.map((strategy) => (
                            <CommandItem
                              value={strategy.label}
                              key={strategy.value}
                              onSelect={() => {
                                form.setValue(
                                  'chunkingStrategy',
                                  strategy.value
                                );
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  strategy.value === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {strategy.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {
                    chunkingStrategyDescriptions[
                      field.value as keyof typeof chunkingStrategyDescriptions
                    ]
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="minChunkSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Chunk Size</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 0]}
                  onValueChange={(value) => {
                    form.setValue('minChunkSize', value[0]);
                  }}
                  min={0}
                  max={1024}
                  step={256}
                  aria-label="Min Chunk Size"
                />
              </FormControl>
              <FormDescription>
                Set the minimum chunk size (0-1024). Current value:{' '}
                {field.value}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxChunkSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Chunk Size</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 0]}
                  onValueChange={(value) => {
                    form.setValue('maxChunkSize', value[0]);
                  }}
                  min={0}
                  max={1024}
                  step={256}
                  aria-label="Max Chunk Size"
                />
              </FormControl>
              <FormDescription>
                Set the maximum chunk size (0-1024). Cannot be smaller than min
                chunk size. Current value: {field.value}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chunkOverlap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chunk Overlap</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 0]}
                  onValueChange={(value) => {
                    form.setValue('chunkOverlap', value[0]);
                  }}
                  min={0}
                  max={256}
                  step={1}
                  aria-label="Chunk Overlap"
                />
              </FormControl>
              <FormDescription>
                Set the chunk overlap (0-256). Current value: {field.value}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chunkBatch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chunk Batch</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 0]}
                  onValueChange={(value) => {
                    form.setValue('chunkBatch', value[0]);
                  }}
                  min={50}
                  max={150}
                  step={50}
                  aria-label="Chunk Batch"
                />
              </FormControl>
              <FormDescription>
                Set the chunk batch (50-150). Current value: {field.value}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" style={{ width: '100%' }}>
          Update settings
        </Button>
      </form>
    </Form>
  );
}
