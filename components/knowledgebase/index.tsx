'use client';

import { useEffect } from 'react';
import { useUploadFile } from '@/hooks/use-upload-file';
import { FileUploader } from '@/components/file-uploader';
import { UploadedFiles } from './uploaded-files';
import { toast } from '@/components/ui/use-toast';

const getUploadedFiles = async () => {
  try {
    const response = await fetch('/api/uploadthing', {
      method: 'GET'
    });
    const data = await response.json();
    if (!response.ok) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: data.error || 'Failed to retrieve file list',
        variant: 'destructive'
      });
      return [];
    }
    return data;
  } catch (error) {
    toast({
      title: 'Uh oh! Something went wrong.',
      description: `${error}`,
      variant: 'destructive'
    });
    return [];
  }
};

export function Knowledgebase() {
  const { onUpload, progresses, uploadedFiles, setUploadedFiles, isUploading } =
    useUploadFile('attachment', { defaultUploadedFiles: [] });

  useEffect(() => {
    const fetchFiles = async () => {
      const list = await getUploadedFiles();
      if (list.files.length > 0) {
        setUploadedFiles(list.files);
      }
    };
    fetchFiles();
  }, [setUploadedFiles]); // Ensure this effect runs only once on mount
  return (
    <div className="space-y-6">
      <FileUploader
        maxFileCount={4}
        maxSize={4 * 1024 * 1024}
        progresses={progresses}
        onUpload={onUpload}
        disabled={isUploading}
      />
      <UploadedFiles
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
      />
    </div>
  );
}
