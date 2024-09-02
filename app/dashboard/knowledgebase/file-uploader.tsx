'use client';

import * as React from 'react';
import Image from 'next/image';
import Dropzone, { type FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { cn, formatBytes } from '@/lib/utils';
import { useControllableState } from '@/hooks/use-controllable-state';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer';
import { FileUploaderProps } from '@/types/file-uploader';

interface FilePreviewProps {
  file: File & { preview: string };
}

interface FileCardProps {
  file: File;
  onRemove: () => void;
  progress?: number;
}

export function FileUploader(props: FileUploaderProps) {
  // TODO: Add configurable Interface
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

      setOpen(true); // Open the dialog or drawer when files are dropped
    },
    [files, maxFileCount, multiple, onUpload, setFiles]
  );

  function onRemove(index: number) {
    if (!files) return;
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onValueChange?.(newFiles);
  }

  // Revoke preview url when component unmounts
  React.useEffect(() => {
    return () => {
      if (!files) return;
      files.forEach((file) => {
        if (isFileWithPreview(file)) {
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

  const DialogOrDrawer = isDesktop ? Dialog : Drawer;
  const DialogOrDrawerTrigger = isDesktop ? DialogTrigger : DrawerTrigger;
  const DialogOrDrawerContent = isDesktop ? DialogContent : DrawerContent;
  const DialogOrDrawerHeader = isDesktop ? DialogHeader : DrawerHeader;
  const DialogOrDrawerTitle = isDesktop ? DialogTitle : DrawerTitle;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (!isOpen) {
      // Clear files when the dialog or drawer is closed
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
                <div className="rounded-full border border-dashed p-3">
                  <Icons.uploadIcon
                    className="size-7 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
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

function FileCard({ file, progress }: FileCardProps) {
  const isUploading = progress !== undefined && progress < 100;
  const isUploaded = progress !== undefined && progress === 100;

  return (
    <div className="relative flex items-center gap-2.5">
      <div className="flex flex-1 gap-2.5">
        {isFileWithPreview(file) ? <FilePreview file={file} /> : null}
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-px">
            <p className="line-clamp-1 text-sm font-medium text-foreground/80">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </p>
          </div>
          {progress !== undefined ? (
            <div className="flex items-center gap-2">
              <Progress value={progress} />
              <span
                className="text-xl"
                style={{ width: '1.5em', textAlign: 'center' }}
              >
                {isUploaded ? (
                  <Icons.checkIcon className="text-success" />
                ) : isUploading ? (
                  <Icons.squareIcon className="text-muted-foreground" />
                ) : (
                  <Icons.squareIcon className="text-muted-foreground" />
                )}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function isFileWithPreview(file: File): file is File & { preview: string } {
  return 'preview' in file && typeof file.preview === 'string';
}

function FilePreview({ file }: FilePreviewProps) {
  if (file.type.startsWith('image/')) {
    return (
      <Image
        src={file.preview}
        alt={file.name}
        width={48}
        height={48}
        loading="lazy"
        className="aspect-square shrink-0 rounded-md object-cover"
      />
    );
  }

  return (
    <Icons.fileTextIcon
      className="size-10 text-muted-foreground"
      aria-hidden="true"
    />
  );
}
