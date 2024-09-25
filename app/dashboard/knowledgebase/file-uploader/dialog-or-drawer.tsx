import React from 'react';
import {
  Dialog,
  DialogContent,
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
import { useMediaQuery } from '@/hooks/use-media-query';

export function DialogOrDrawer({
  children,
  open,
  onOpenChange
}: React.PropsWithChildren<{
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}>) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return isDesktop ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer>
  );
}

export const DialogOrDrawerTrigger = (
  props: React.ComponentPropsWithoutRef<typeof DialogTrigger> &
    React.ComponentPropsWithoutRef<typeof DrawerTrigger>
) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return isDesktop ? (
    <DialogTrigger {...props} />
  ) : (
    <DrawerTrigger {...props} />
  );
};

export const DialogOrDrawerContent = (
  props: React.ComponentPropsWithoutRef<typeof DialogContent> &
    React.ComponentPropsWithoutRef<typeof DrawerContent>
) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return isDesktop ? (
    <DialogContent {...props} 
    />
  ) : (
    <DrawerContent {...props} />
  );
};

export const DialogOrDrawerHeader = (
  props: React.ComponentPropsWithoutRef<typeof DialogHeader> &
    React.ComponentPropsWithoutRef<typeof DrawerHeader>
) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return isDesktop ? <DialogHeader {...props} /> : <DrawerHeader {...props} />;
};

export const DialogOrDrawerTitle = (
  props: React.ComponentPropsWithoutRef<typeof DialogTitle> &
    React.ComponentPropsWithoutRef<typeof DrawerTitle>
) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return isDesktop ? <DialogTitle {...props} /> : <DrawerTitle {...props} />;
};
