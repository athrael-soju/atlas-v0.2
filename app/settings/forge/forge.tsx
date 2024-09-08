'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
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
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { IUser } from '@/models/User';
import { forgeFormSchema, ForgeFormValues } from '@/lib/form-schema';
import {
  parsingProviders,
  partitioningStrategies,
  chunkingStrategies,
  partitioningStrategyDescriptions,
  chunkingStrategyDescriptions
} from '@/constants/forge';
const defaultValues: Partial<ForgeFormValues> = {
  parsingProvider: 'io',
  partitioningStrategy: 'fast',
  chunkingStrategy: 'basic',
  minChunkSize: 0,
  maxChunkSize: 1024,
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

  // Fetch user settings from the database on mount
  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/user', {
            method: 'GET'
          });

          if (response.ok) {
            const result = await response.json();
            // Ensure that `result` contains the correct structure
            if (result?.settings?.forge) {
              form.reset(result.settings.forge); // Reset the form with the forge settings
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