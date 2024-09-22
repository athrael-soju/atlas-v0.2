'use client';

import { useEffect, useState } from 'react';
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileInput
} from '@/components/file-uploader';
import { Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropzoneOptions } from 'react-dropzone';

const FileSvgDraw = () => {
  return (
    <>
      <svg
        className="mb-3 h-8 w-8 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Click to upload</span>
        &nbsp; or drag and drop
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        SVG, PNG, JPG or GIF
      </p>
    </>
  );
};

export const AssistantFileUploader = () => {
  const [files, setFiles] = useState<File[] | null>(null);

  const dropZoneConfig = {
    multiple: true,
    maxFiles: 20,
    maxSize: 20 * 1024 * 1024
  } satisfies DropzoneOptions;

  useEffect(() => {
    async function processFiles() {
      if (files && files.length > 0) {
        const formData = new FormData();

        // Append all files at once, using the same key
        files.forEach((file) => {
          formData.append('files', file); // Notice `files[]` here to group all files under the same key
        });

        try {
          const response = await fetch('/api/assistants/files/analysis', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Files uploaded:', data.files);
          }
          setFiles([]); // Reset files after successful upload
        } catch (error) {
          console.error('Error uploading files:', error);
        }
      }
    }
    processFiles();
  }, [files]); // Only runs when files change

  return (
    <FileUploader
      value={files}
      onValueChange={setFiles}
      dropzoneOptions={dropZoneConfig}
      className="relative rounded-lg border border-dashed border-gray-300 bg-background p-2 dark:border-gray-700"
    >
      <FileInput className="outline-dashed outline-1 outline-white">
        <div className="flex w-full flex-col items-center justify-center pb-4 pt-3 ">
          <FileSvgDraw />
        </div>
      </FileInput>

      <ScrollArea
        className="w-full overflow-y-auto"
        style={{ height: 'calc(100vh - 245px)' }}
      >
        <FileUploaderContent>
          {files &&
            files.length > 0 &&
            files.map((file, i) => (
              <FileUploaderItem key={i} index={i}>
                <Paperclip className="h-4 w-4 stroke-current" />
                <span>{file.name}</span>
              </FileUploaderItem>
            ))}
        </FileUploaderContent>
      </ScrollArea>
    </FileUploader>
  );
};
