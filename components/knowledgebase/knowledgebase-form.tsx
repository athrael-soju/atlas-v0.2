'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import FileUpload from '@/components/file-upload';

const FileSchema = z.object({
  fileName: z.string(),
  name: z.string(),
  fileSize: z.number(),
  size: z.number(),
  fileKey: z.string(),
  key: z.string(),
  fileUrl: z.string(),
  url: z.string()
});
export const FILE_MAX_LIMIT = 3;

const knowledgebaseFormSchema = z.object({
  fileUrl: z
    .array(FileSchema)
    .max(FILE_MAX_LIMIT, { message: 'You can only add up to 3 files' })
    .min(1, { message: 'At least one file must be added.' })
});

type KnowledgeFormValues = z.infer<typeof knowledgebaseFormSchema>;

const defaultValues: Partial<KnowledgeFormValues> = {
  fileUrl: []
};
export function KnowledgebaseForm() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const userEmail = user?.email;
  const form = useForm<KnowledgeFormValues>({
    resolver: zodResolver(knowledgebaseFormSchema),
    defaultValues
  });

  async function onSubmit(data: KnowledgeFormValues) {
    toast({
      title: 'Settings Updated',
      description: 'Your settings have been successfully updated.',
      variant: 'default'
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="fileUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FileUpload
                  onChange={field.onChange}
                  value={field.value}
                  onRemove={field.onChange}
                />
              </FormControl>
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
