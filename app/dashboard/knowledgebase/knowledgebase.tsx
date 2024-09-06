'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { useHandleFiles } from '@/hooks/use-handle-files';
import { FileUploader } from '@/app/dashboard/knowledgebase/file-uploader';
import { UploadedFiles } from '@/app/dashboard/knowledgebase/uploaded-files';
import { useEffect } from 'react';

const FormSchema = z.object({
  processAll: z.boolean().default(false)
});

export function Knowledgebase() {
  const {
    onUpload,
    progress,
    uploadedFiles,
    setUploadedFiles,
    isUploading,
    fetchUploadedFiles,
    isFetchingFiles
  } = useHandleFiles('attachment');

  useEffect(() => {
    fetchUploadedFiles();
  }, [fetchUploadedFiles]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      processAll: false
    }
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    toast({
      title: 'Processing Files',
      description: `Processing ${
        data.processAll ? 'All Files' : 'New Files Only'
      }`
    });

    try {
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
          maxSize={4 * 1024 * 1024} // 4 MB
          progress={progress}
          onUpload={onUpload}
          disabled={isUploading}
        />

        {/* Uploaded Files Display Component */}
        <UploadedFiles
          uploadedFiles={uploadedFiles ?? []}
          setUploadedFiles={setUploadedFiles}
          isFetchingFiles={isFetchingFiles ?? false}
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isUploading}
        >
          Process Files
        </button>
      </form>
    </Form>
  );
}
