import * as React from 'react';
import type { UploadedFile } from '@/types';
import { toast } from '@/components/ui/use-toast';
import type { UploadFilesOptions } from 'uploadthing/types';

import { getErrorMessage } from '@/lib/handle-error';
import { uploadFiles } from '@/lib/uploadthing';
import { type OurFileRouter } from '@/lib/service/uploadthing';

interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<OurFileRouter, keyof OurFileRouter>,
    'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
  > {
  defaultUploadedFiles?: UploadedFile[];
}

export function useUploadFile(
  endpoint: keyof OurFileRouter,
  { defaultUploadedFiles = [], ...props }: UseUploadFileProps = {}
) {
  const [uploadedFiles, setUploadedFiles] =
    React.useState<UploadedFile[]>(defaultUploadedFiles);
  const [progresses, setProgresses] = React.useState<Record<string, number>>(
    {}
  );
  const [isUploading, setIsUploading] = React.useState(false);

  async function onUpload(files: File[]) {
    setIsUploading(true);
    try {
      const res = await uploadFiles(endpoint, {
        ...props,
        files,
        onUploadProgress: ({ file, progress }) => {
          setProgresses((prev) => {
            return {
              ...prev,
              [file]: progress
            };
          });
        }
      });

      setUploadedFiles((prev) => (prev ? [...prev, ...res] : res));
    } catch (err) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: getErrorMessage(err),
        variant: 'destructive'
      });
    } finally {
      setProgresses({});
      setIsUploading(false);
    }
  }

  return {
    onUpload,
    uploadedFiles,
    setUploadedFiles,
    progresses,
    isUploading
  };
}
