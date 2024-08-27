'use client';

import Image from 'next/image';
import type { UploadedFile } from '@/types';

import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { EmptyCard } from '@/components/empty-card';
import { Button } from '@/components/ui/button';
import { Trash2, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Dispatch, SetStateAction } from 'react';

interface UploadedFilesProps {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: Dispatch<SetStateAction<UploadedFile[]>>;
}

export function UploadedFiles({
  uploadedFiles,
  setUploadedFiles
}: UploadedFilesProps) {
  const onDeleteFile = async (name: string, key: string) => {
    try {
      const response = await fetch('/api/uploadthing', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: 'Uh oh! Something went wrong.',
          description: errorData.error || 'Failed to delete files',
          variant: 'destructive'
        });
        return;
      }

      const result = await response.json();
      if (result.success && result.deleteCount > 0) {
        toast({
          title: 'Done!',
          description: `File '${name}' has been deleted successfully`,
          variant: 'default'
        });
        setUploadedFiles(uploadedFiles.filter((file) => file.key !== key));
      } else {
        toast({
          title: 'Uh oh! Something went wrong.',
          description: `File '${name}' has not been deleted`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  };

  const isImage = (fileName: string) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
  };

  return (
    <Card style={{ height: 'calc(100vh - 425px)' }}>
      {uploadedFiles.length > 0 ? (
        <ScrollArea className="pb-4">
          <div className="flex w-max space-x-2.5">
            {uploadedFiles.map((file) => (
              <div key={file.key} className="relative aspect-video w-64">
                <div className="absolute right-2 top-2 z-10">
                  <Button
                    type="button"
                    onClick={() => onDeleteFile(file.name, file.key)}
                    variant="link"
                    size="icon"
                  >
                    <Trash2 color="#ba1212" />
                  </Button>
                </div>
                <div className="relative flex h-full w-full items-center justify-center rounded-md bg-gray-200 p-2">
                  {isImage(file.name) ? (
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      sizes="(min-width: 640px) 640px, 100vw"
                      loading="lazy"
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <>
                      <FileText size={48} color="#6b7280" />
                      <p className="text-md absolute bottom-2 w-full truncate px-2 text-center text-gray-800">
                        {file.name}
                      </p>
                    </>
                  )}
                </div>
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
          style={{ height: 'calc(100vh - 425px)', overflow: 'visible' }}
        />
      )}
    </Card>
  );
}
