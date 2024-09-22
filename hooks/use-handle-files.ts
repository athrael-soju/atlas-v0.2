import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/handle-error';
import { uploadFiles } from '@/lib/uploadthing';
import type { KnowledgebaseFile } from '@/types/file-uploader';
import type { UploadFilesOptions } from 'uploadthing/types';
import { type OurFileRouter } from '@/lib/client/uploadthing';
import { useControllableState } from '@/hooks/use-controllable-state';

interface useHandleFilesProps
  extends Partial<UploadFilesOptions<OurFileRouter, keyof OurFileRouter>> {}

export function useHandleFiles(
  endpoint: keyof OurFileRouter,
  props: useHandleFilesProps = {}
) {
  const [knowledgebaseFiles, setKnowledgebaseFiles] = useControllableState<
    KnowledgebaseFile[] | undefined
  >({
    defaultProp: [],
    onChange: (files) => {
      //console.info('Uploaded files changed:', files);
    }
  });

  const [progress, setProgress] = useControllableState<Record<string, number>>({
    defaultProp: {}
  });

  const [isFetchingFiles, setIsFetchingFiles] = useControllableState<boolean>({
    defaultProp: false
  });

  const [isUploading, setIsUploading] = useControllableState<boolean>({
    defaultProp: false
  });

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
  }, [setKnowledgebaseFiles, setIsFetchingFiles]);

  const onUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      await uploadFiles(endpoint, {
        ...props,
        files,
        onUploadProgress: ({ file, progress }) => {
          setProgress((prev) => ({ ...prev, [file]: progress }));
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
