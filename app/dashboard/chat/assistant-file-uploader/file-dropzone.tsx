'use client';

import React from 'react';
import Dropzone from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

type FileDropzoneProps = {
  onDrop: (acceptedFiles: File[], rejectedFiles: any[]) => void;
  isUploading: boolean;
};

export const FileDropzone = ({
  onDrop,
  isUploading
}: FileDropzoneProps) => (
  <Dropzone onDrop={onDrop}>
    {({ getRootProps, getInputProps, isDragActive }) => (
      <div
        {...getRootProps()}
        className={cn(
          'h-42 group relative grid w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragActive && 'border-muted-foreground/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
          <div className="rounded-full border border-dashed p-3">
            <Icons.uploadIcon
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col gap-px">
            <p className="font-medium text-muted-foreground">
              Drop or select files to upload
            </p>
            <p className="text-sm text-muted-foreground/70">
              You can upload multiple files
            </p>
          </div>
        </div>
      </div>
    )}
  </Dropzone>
);
