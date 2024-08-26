'use client';

import { useUploadFile } from '@/hooks/use-upload-file';
import { FileUploader } from '@/components/file-uploader';
import { UploadedFilesCard } from './uploaded-files-card';

export function Knowledgebase() {
  const { onUpload, progresses, uploadedFiles, setUploadedFiles, isUploading } =
    useUploadFile('attachment', { defaultUploadedFiles: [] });

  return (
    <div className="space-y-6">
      <FileUploader
        maxFileCount={4}
        maxSize={4 * 1024 * 1024}
        progresses={progresses}
        onUpload={onUpload}
        disabled={isUploading}
      />
      <UploadedFilesCard
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
      />
    </div>
  );
}
