import React from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';
import { formatBytes } from '@/lib/utils';
import { FileCardProps } from '@/types/file-uploader';

export function FileCard({ file, progress }: FileCardProps) {
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

interface FilePreviewProps {
  file: File & { preview: string };
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
