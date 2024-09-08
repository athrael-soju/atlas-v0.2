'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { Searching } from '@/components/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { IUser } from '@/models/User';
import { knowledgebaseSchema, KnowledgebaseValues } from '@/lib/form-schema';

const defaultValues: Partial<KnowledgebaseValues> = {
  cohereTopN: 10,
  cohereRelevanceThreshold: 50,
  pineconeTopK: 100
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

export function KnowledgebaseForm() {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const form = useForm<KnowledgebaseValues>({
    resolver: zodResolver(knowledgebaseSchema),
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

            // Ensure that `result.user` and `result.user.settings` exist
            const knowledgebaseSettings = result?.settings?.knowledgebase;

            if (knowledgebaseSettings) {
              form.reset(knowledgebaseSettings);
            } else {
              form.reset(defaultValues);
            }
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
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [form, userId]);

  async function onSubmit(data: KnowledgebaseValues) {
    const partialData: Partial<IUser> = {
      settings: { knowledgebase: data }
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
        <FormField
          control={form.control}
          name="cohereTopN"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cohere Top N</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 0]}
                  onValueChange={(value) => {
                    form.setValue('cohereTopN', value[0]);
                  }}
                  min={1}
                  max={100}
                  step={1}
                  aria-label="Cohere Top N"
                />
              </FormControl>
              <FormDescription>
                Set the top N results to consider (1-100). Current value:{' '}
                {field.value}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cohereRelevanceThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cohere Relevance Threshold</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 0]}
                  onValueChange={(value) => {
                    form.setValue('cohereRelevanceThreshold', value[0]);
                  }}
                  min={0}
                  max={100}
                  step={5}
                  aria-label="Cohere Relevance Threshold"
                />
              </FormControl>
              <FormDescription>
                Set the relevance threshold (0-100). Current value:{' '}
                {field.value}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pineconeTopK"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pinecone Top K</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 0]}
                  onValueChange={(value) => {
                    form.setValue('pineconeTopK', value[0]);
                  }}
                  min={100}
                  max={1000}
                  step={100}
                  aria-label="Pinecone Top K"
                />
              </FormControl>
              <FormDescription>
                Set the top K results to retrieve (100-1000). Current value:{' '}
                {field.value}
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
