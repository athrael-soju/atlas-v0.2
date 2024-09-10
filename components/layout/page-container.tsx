import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PageContainer({
  children,
  scrollable = false
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100vh-52px)]">
          <div className="flex h-full flex-col p-4 md:px-8">{children}</div>
        </ScrollArea>
      ) : (
        <div className="flex h-full flex-col p-4 md:px-8">{children}</div>
      )}
    </>
  );
}
