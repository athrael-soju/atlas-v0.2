import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/handle-error';
import { uploadFiles } from '@/lib/uploadthing';
import type { KnowledgebaseFile } from '@/types/file-uploader';
import type { UploadFilesOptions } from 'uploadthing/types';
import { type OurFileRouter } from '@/lib/client/uploadthing';

interface useHandleFilesProps
  extends Partial<UploadFilesOptions<OurFileRouter, keyof OurFileRouter>> {}

export function useHandleFiles(
  endpoint: keyof OurFileRouter,
  props: useHandleFilesProps = {}
) {
  // Replacing useControllableState with useState to ensure stability
  const [knowledgebaseFiles, setKnowledgebaseFiles] = useState<
    KnowledgebaseFile[] | undefined
  >([]);

  const [progress, setProgress] = useState<Record<string, number>>({});

  const [isFetchingFiles, setIsFetchingFiles] = useState<boolean>(false);

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fetchKnowledgebaseFiles = useCallback(async () => {
    try {
      setIsFetchingFiles(true);
      const response = await fetch('/api/uploadthing', {
        method: 'GET'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve file list');
      }
      setKnowledgebaseFiles(data.files || []);
    } catch (error) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: `${error}`,
        variant: 'destructive'
      });
      setKnowledgebaseFiles([]);
    } finally {
      setIsFetchingFiles(false);
    }
  }, []); // `useState` guarantees `setKnowledgebaseFiles` is stable, so `fetchKnowledgebaseFiles` is stable

  const onUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      await uploadFiles(endpoint, {
        ...props,
        files,
        onUploadProgress: ({ file, progress }) => {
          setProgress((prev) => ({ ...prev, [file.name]: progress }));
        }
      }).then(() => fetchKnowledgebaseFiles());
    } catch (err) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: getErrorMessage(err),
        variant: 'destructive'
      });
    } finally {
      setProgress({});
      setIsUploading(false);
    }
  };

  return {
    knowledgebaseFiles,
    setKnowledgebaseFiles,
    progress,
    isUploading,
    onUpload,
    fetchKnowledgebaseFiles,
    isFetchingFiles
  };
}
