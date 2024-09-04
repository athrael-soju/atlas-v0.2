'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { useHandleFiles } from '@/hooks/use-handle-files';
import { FileUploader } from '@/app/dashboard/knowledgebase/file-uploader';
import { UploadedFiles } from './uploaded-files';
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

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast({
      title: 'Processing Files',
      description: `Processing ${
        data.processAll ? 'All Files' : 'New Files Only'
      }`
    });
    //TODO: Implement the file processing logic based on `data.processAll`
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* TODO: Ensure consistency between FileUploader and UploadThing */}
          <FileUploader
            maxFileCount={5}
            maxSize={4 * 1024 * 1024}
            progress={progress}
            onUpload={onUpload}
            disabled={isUploading}
          />
          <UploadedFiles
            uploadedFiles={uploadedFiles ?? []}
            setUploadedFiles={setUploadedFiles}
            isFetchingFiles={isFetchingFiles ?? false}
          />
        </form>
      </Form>
    </>
  );
}
