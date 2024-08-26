import Image from 'next/image';
import type { UploadedFile } from '@/types';

import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { EmptyCard } from '@/components/empty-card';

interface UploadedFilesCardProps {
  uploadedFiles: UploadedFile[];
}

export function UploadedFilesCard({ uploadedFiles }: UploadedFilesCardProps) {
  return (
    <Card style={{ height: 'calc(100vh - 425px)' }}>
      {uploadedFiles.length > 0 ? (
        <ScrollArea className="pb-4">
          <div className="flex w-max space-x-2.5">
            {uploadedFiles.map((file) => (
              <div key={file.key} className="relative aspect-video w-32">
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  sizes="(min-width: 640px) 640px, 100vw"
                  loading="lazy"
                  className="rounded-md object-cover"
                />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <EmptyCard
          title="No files uploaded"
          description="Uploaded files will be shown"
          className="w-full"
          style={{ height: 'calc(100vh - 425px)' }}
        />
      )}
    </Card>
  );
}
