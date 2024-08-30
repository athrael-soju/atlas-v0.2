import * as React from 'react';
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/handle-error';
import { uploadFiles } from '@/lib/uploadthing';
import type { UploadedFile } from '@/types/uploadthing';
import type { UploadFilesOptions } from 'uploadthing/types';
import { type OurFileRouter } from '@/lib/service/uploadthing';
import { useControllableState } from '@/hooks/use-controllable-state';

interface useHandleFilesProps
  extends Partial<UploadFilesOptions<OurFileRouter, keyof OurFileRouter>> {}

export function useHandleFiles(
  endpoint: keyof OurFileRouter,
  props: useHandleFilesProps = {}
) {
  const [uploadedFiles, setUploadedFiles] = useControllableState<
    UploadedFile[]
  >({
    defaultProp: [],
    onChange: (files) => {
      console.info('Uploaded files changed:', files);
    }
  });

  const [progresses, setProgresses] = useControllableState<
    Record<string, number>
  >({
    defaultProp: {}
  });

  const [isFetchingFiles, setIsFetchingFiles] = useControllableState<boolean>({
    defaultProp: false
  });

  const [isUploading, setIsUploading] = useControllableState<boolean>({
    defaultProp: false
  });

  const fetchUploadedFiles = useCallback(async () => {
    try {
      setIsFetchingFiles(true);
      const response = await fetch('/api/uploadthing', {
        method: 'GET'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve file list');
      }
      setUploadedFiles(data.files || []);
    } catch (error) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: `${error}`,
        variant: 'destructive'
      });
      setUploadedFiles([]);
    } finally {
      setIsFetchingFiles(false);
    }
  }, [setUploadedFiles, setIsFetchingFiles]);

  const onUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      const res = await uploadFiles(endpoint, {
        ...props,
        files,
        onUploadProgress: ({ file, progress }) => {
          setProgresses((prev) => ({ ...prev, [file]: progress }));
        }
      });
      setUploadedFiles((prev = []) => [...prev, ...res]);
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
  };

  return {
    uploadedFiles,
    setUploadedFiles,
    progresses,
    isUploading,
    onUpload,
    fetchUploadedFiles,
    isFetchingFiles
  };
}
