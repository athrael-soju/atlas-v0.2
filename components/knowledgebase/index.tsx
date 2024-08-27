'use client';

import { useHandleFiles } from '@/hooks/use-handle-files';
import { FileUploader } from '@/components/file-uploader';
import { UploadedFiles } from './uploaded-files';

export function Knowledgebase() {
  const { onUpload, progresses, uploadedFiles, setUploadedFiles, isUploading } =
    useHandleFiles('attachment');

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
