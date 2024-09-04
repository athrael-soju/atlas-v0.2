'use client';

import { z } from 'zod';
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
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { Searching } from '@/components/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { IUser } from '@/models/User';

const knowledgebaseSchema = z.object({
  cohereTopN: z.number().min(1).max(100).step(1),
  cohereRelevanceThreshold: z.number().min(0).max(100).step(5),
  pineconeTopK: z.number().min(100).max(1000).step(100)
});

type KnowledgebaseValues = z.infer<typeof knowledgebaseSchema>;

const defaultValues: Partial<KnowledgebaseValues> = {
  cohereTopN: 10,
  cohereRelevanceThreshold: 50,
  pineconeTopK: 100
};

export function KnowledgebaseForm() {
  const { data: session } = useSession();
  const user = session?.user;
  const userEmail = user?.email;
  const [loading, setLoading] = useState(true);
  const form = useForm<KnowledgebaseValues>({
    resolver: zodResolver(knowledgebaseSchema),
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
            if (result.user.settings.knowledgebase) {
              form.reset(result.user.settings.knowledgebase);
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

        <Button type="submit" style={{ width: '100%' }}>
          Update settings
        </Button>
      </form>
    </Form>
  );
}
