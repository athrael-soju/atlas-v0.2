'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { useHandleFiles } from '@/hooks/use-handle-files';
import { FileUploader } from '@/app/dashboard/knowledgebase/file-uploader';
import { KnowledgebaseFiles } from '@/app/dashboard/knowledgebase/file-list';
import { useEffect, useState, useRef } from 'react';

const FormSchema = z.object({
  processAll: z.boolean().default(false)
});

export function Knowledgebase() {
  const {
    onUpload,
    progress,
    knowledgebaseFiles,
    setKnowledgebaseFiles,
    isUploading,
    fetchKnowledgebaseFiles,
    isFetchingFiles
  } = useHandleFiles('attachment');
  const [working, setWorking] = useState(false);

  // Avoid multiple fetches by using a ref
  const hasFetchedFiles = useRef(false);

  useEffect(() => {
    if (!hasFetchedFiles.current) {
      fetchKnowledgebaseFiles();
      hasFetchedFiles.current = true;
    }
  }, [fetchKnowledgebaseFiles]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      processAll: false
    }
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      toast({
        title: 'Processing Files',
        description: `Processing ${
          data.processAll ? 'All Files' : 'New Files Only'
        }`
      });

      const response = await fetch('/api/process-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          processAll: data.processAll
        })
      });

      if (response.ok) {
        toast({
          title: 'Processing Complete',
          description: `Files have been successfully processed.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error Processing Files',
          description:
            'There was an error processing the files. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while processing the files.',
        variant: 'destructive'
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* File Uploader Component */}
        <FileUploader
          maxFileCount={5}
          maxSize={1024 * 1024 * 100}
          progress={progress}
          onUpload={onUpload}
          disabled={isUploading}
        />

        {/* Uploaded Files Display Component */}
        <KnowledgebaseFiles
          knowledgebaseFiles={knowledgebaseFiles ?? []}
          setKnowledgebaseFiles={setKnowledgebaseFiles}
          isFetchingFiles={isFetchingFiles ?? false}
          working={working}
          setWorking={setWorking}
          isUploading={isUploading ?? false}
        />
      </form>
    </Form>
  );
}
