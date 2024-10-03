'use client';

import { useState } from 'react';
import { knowledgebaseSchema, KnowledgebaseValues } from '@/lib/form-schema';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { SettingCard } from '../card';
import { SliderSetting } from '../slider';
import { Button } from '@/components/ui/button'; // ShadCN Button import
import { ListOrdered, Filter, Database } from 'lucide-react';
import { KnowledgebaseFormSkeleton } from './skeleton'; // Import the skeleton

const defaultValues: Partial<KnowledgebaseValues> = {
  rerankTopN: 10,
  cohereRelevanceThreshold: 0,
  pineconeTopK: 100
};

export function KnowledgebaseForm() {
  const { form, loading, onSubmit } = useFetchAndSubmit<KnowledgebaseValues>({
    schema: knowledgebaseSchema,
    defaultValues,
    formPath: 'settings.knowledgebase'
  });

  const [saving, setSaving] = useState(false); // Track the saving state

  // Handle form submission on button click
  const handleSave = async () => {
    setSaving(true);
    try {
      onSubmit(form.getValues() as KnowledgebaseValues); // Get form values and submit
    } finally {
      setSaving(false); // Reset saving state after submission
    }
  };

  if (loading) {
    return <KnowledgebaseFormSkeleton />; // Render the skeleton component
  }

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        <SettingCard
          icon={<ListOrdered className="h-8 w-8 text-primary" />}
          title="Rerank Top N"
          description="Set the top N results to consider (1-100)"
        >
          <SliderSetting
            label="Rerank Top N"
            value={form.watch('rerankTopN')}
            min={1}
            max={100}
            step={1}
            onValueChange={(val) => form.setValue('rerankTopN', val)}
            description="Number of top results"
          />
        </SettingCard>

        <SettingCard
          icon={<Filter className="h-8 w-8 text-primary" />}
          title="Rerank Relevance Threshold"
          description="Set the relevance threshold (0-100)"
        >
          <SliderSetting
            label="Rerank Relevance Threshold"
            value={form.watch('cohereRelevanceThreshold')}
            min={0}
            max={100}
            step={5}
            onValueChange={(val) =>
              form.setValue('cohereRelevanceThreshold', val)
            }
            description="Relevance threshold value"
          />
        </SettingCard>

        <SettingCard
          icon={<Database className="h-8 w-8 text-primary" />}
          title="Vector DB Top K"
          description="Set the top K results to retrieve (100-1000)"
        >
          <SliderSetting
            label="Vector DB Top K"
            value={form.watch('pineconeTopK')}
            min={100}
            max={1000}
            step={100}
            onValueChange={(val) => form.setValue('pineconeTopK', val)}
            description="Number of top results to retrieve"
          />
        </SettingCard>
      </div>

      <div className="mt-8 flex justify-center">
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
