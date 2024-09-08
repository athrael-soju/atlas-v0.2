'use client';

import * as React from 'react';
import Dropzone, { FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { cn, formatBytes } from '@/lib/utils';
import { useControllableState } from '@/hooks/use-controllable-state';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { FileCard } from '@/app/dashboard/knowledgebase/file-card';
import { FileUploaderProps } from '@/types/file-uploader';
import {
  DialogOrDrawer,
  DialogOrDrawerTrigger,
  DialogOrDrawerContent,
  DialogOrDrawerHeader,
  DialogOrDrawerTitle
} from '@/app/dashboard/knowledgebase/dialog-or-drawer';
import { Icons } from '@/components/icons';
import { DialogDescription } from '@/components/ui/dialog';

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
    maxSize = 1024 * 1024 * 2,
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

  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

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
        updatedFiles.length > 0 &&
        updatedFiles.length <= maxFileCount
      ) {
        const target =
          updatedFiles.length > 0 ? `${updatedFiles.length} files` : `file`;

        toast.promise(onUpload(updatedFiles), {
          loading: `Uploading ${target}...`,
          success: () => {
            return `${target} uploaded successfully`;
          },
          error: `Failed to upload ${target}`
        });
      }

      setOpen(true);
    },
    [files, maxFileCount, multiple, onUpload, setFiles]
  );

  const onRemove = (index: number) => {
    if (!files) return;
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onValueChange?.(newFiles);
  };

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

  const allUploaded =
    (files?.length ?? 0) > 0 &&
    files?.every((file) => progress?.[file.name] === 100);
  const title = allUploaded ? 'Files Uploaded!' : 'Uploading Files';
  const emoticon = allUploaded ? '😊' : '🚚';

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (!isOpen) {
      setFiles([]);
    }
  };

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
      {/* TODO: Potentially find an alternative to the progress bar overlay */}
      <DialogOrDrawer open={open} onOpenChange={handleOpenChange}>
        <DialogOrDrawerTrigger asChild>
          <Button variant="outline" className="hidden">
            View Files
          </Button>
        </DialogOrDrawerTrigger>
        <DialogOrDrawerContent aria-describedby="file-upload-description">
          <DialogOrDrawerHeader>
            <DialogOrDrawerTitle>
              {emoticon} {title}
            </DialogOrDrawerTitle>
            <DialogDescription />
          </DialogOrDrawerHeader>
          <div className="flex flex-col gap-4">
            {files?.map((file, index) => (
              <FileCard
                key={index}
                file={file}
                onRemove={() => onRemove(index)}
                progress={progress?.[file.name]}
              />
            ))}
          </div>
        </DialogOrDrawerContent>
      </DialogOrDrawer>
    </div>
  );
}
