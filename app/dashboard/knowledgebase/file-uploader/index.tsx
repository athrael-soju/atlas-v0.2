'use client';

import * as React from 'react';
import Dropzone, { FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { cn, formatBytes } from '@/lib/utils';
import { useControllableState } from '@/hooks/use-controllable-state';
import { FileUploaderProps } from '@/types/file-uploader';
import { Icons } from '@/components/icons';

export function FileUploader(props: FileUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    onUpload,
    progress,
    accept = {
      'application/pdf': [],
      'image/*': []
    },
    maxSize = 1024 * 1024 * 50,
    maxFileCount = 5,
    multiple = true,
    disabled = false,
    className,
    ...dropzoneProps
  } = props;

  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange
  });

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && acceptedFiles.length > 1) {
        toast.error(`Cannot upload more than 1 file at a time`);
        return;
      }

      if ((files?.length ?? 0) + acceptedFiles.length > maxFileCount) {
        toast.error(`Cannot upload more than ${maxFileCount} files`);
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      );
      const updatedFiles = files ? [...files, ...newFiles] : newFiles;

      setFiles(updatedFiles);

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file }) => {
          toast.error(`File ${file.name} was rejected`);
        });
      }

      if (
        onUpload &&
        newFiles.length > 0 &&
        (files?.length ?? 0) + newFiles.length <= maxFileCount
      ) {
        const target =
          newFiles.length > 1 ? `${newFiles.length} files` : `file`;

        toast.promise(onUpload(newFiles), {
          loading: `Uploading ${target}...`,
          success: () => `${target} uploaded successfully`,
          error: `Failed to upload ${target}`
        });
      }
    },
    [files, maxFileCount, multiple, onUpload, setFiles]
  );

  React.useEffect(() => {
    return () => {
      if (!files) return;
      files.forEach((file) => {
        if ('preview' in file && typeof file.preview === 'string') {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const isDisabled = disabled || (files?.length ?? 0) >= maxFileCount;

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <Dropzone
        onDrop={onDrop}
        accept={accept}
        maxSize={maxSize}
        maxFiles={maxFileCount}
        multiple={maxFileCount > 1 || multiple}
        disabled={isDisabled}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              'h-42 group relative grid w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25',
              'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isDragActive && 'border-muted-foreground/50',
              isDisabled && 'pointer-events-none opacity-60',
              className
            )}
            {...dropzoneProps}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                <Icons.uploadIcon
                  className="size-7 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="font-medium text-muted-foreground">
                  Drop the files here
                </p>
              </div>
            ) : (
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
                    You can upload
                    {maxFileCount > 1
                      ? ` ${
                          maxFileCount === Infinity ? 'multiple' : maxFileCount
                        }
                      files (up to ${formatBytes(maxSize)} each)`
                      : ` a file with ${formatBytes(maxSize)}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>
    </div>
  );
}
