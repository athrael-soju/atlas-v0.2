// app\dashboard\knowledgebase\knowledgebase.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
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
    progresses,
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
    // toast({
    //   title: 'Processing Files',
    //   description: `Processing ${
    //     data.processAll ? 'All Files' : 'New Files Only'
    //   }`
    // });
    // TODO: Implement the file processing logic based on `data.processAll`
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FileUploader
            maxFileCount={4}
            maxSize={4 * 1024 * 1024}
            progresses={progresses}
            onUpload={onUpload}
            disabled={isUploading}
          />
          <UploadedFiles
            uploadedFiles={uploadedFiles ?? []}
            setUploadedFiles={setUploadedFiles}
            isFetchingFiles={isFetchingFiles ?? false}
          />

          <FormField
            control={form.control}
            name="processAll"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Process All Files</FormLabel>
                  <FormDescription>
                    If selected, all files will be processed and any files with
                    the same filename will be overwritten.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" style={{ width: '100%' }}>
            Process Files
          </Button>
        </form>
      </Form>
    </>
  );
}
