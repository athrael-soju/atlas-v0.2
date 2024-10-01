'use client';

import React, { useState } from 'react';
import { SortingState } from '@tanstack/react-table';
import { toast } from '@/components/ui/use-toast';
import { EmptyCard } from '@/components/empty-card';
import { useSession } from 'next-auth/react';
import { processSelectedFiles } from '@/lib/service/atlas';
import { getUserData } from '@/lib/service/mongodb';
import {
  KnowledgebaseFile,
  KnowledgebaseFilesProps
} from '@/types/file-uploader';
import { KnowledgebaseTable } from './table';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function KnowledgebaseFiles({
  knowledgebaseFiles,
  setKnowledgebaseFiles,
  isFetchingFiles,
  working,
  setWorking,
  isUploading
}: KnowledgebaseFilesProps) {
  const { data: session } = useSession();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const onDeleteFiles = async (files: KnowledgebaseFile[]) => {
    setWorking(true);
    const userId = session?.user.id as string;
    try {
      const response = await fetch('/api/uploadthing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, files })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete files');
      }

      const result = await response.json();
      if (result.deletedFileCount > 0) {
        toast({
          title: 'Done!',
          description: `${result.deletedFileCount} file(s) have been deleted successfully`,
          variant: 'default'
        });
        setKnowledgebaseFiles(
          knowledgebaseFiles.filter((file) => !files.includes(file))
        );
      } else {
        toast({
          title: 'Uh oh! Something went wrong.',
          description: `Some files may have not been deleted`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: `${error}`,
        variant: 'destructive'
      });
    } finally {
      setWorking(false);
    }
  };

  const handleDeleteSelected = async (selectedFiles: KnowledgebaseFile[]) => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to delete.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setWorking(true);
      await onDeleteFiles(selectedFiles);
    } catch (error) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: `${error}`,
        variant: 'destructive'
      });
    } finally {
      setWorking(false);
    }
  };

  const handleProcessSelected = async (selectedFiles: KnowledgebaseFile[]) => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to process.',
        variant: 'default'
      });
      return;
    }

    try {
      setWorking(true);
      const userId = session?.user.id as string;
      const selectedFileKeys = selectedFiles.map((file) => file.key);

      toast({
        title: 'Processing files',
        description: 'Selected files are being processed.',
        variant: 'default'
      });
      await processSelectedFiles(userId, selectedFileKeys);
      const userData = await getUserData(userId);
      const userFiles = userData.files.knowledgebase as KnowledgebaseFile[];
      setKnowledgebaseFiles(userFiles);
    } catch (error) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: `${error}`,
        variant: 'destructive'
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {working || isUploading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="flex h-[calc(100vh-350px)] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </Card>
        </motion.div>
      ) : knowledgebaseFiles.length > 0 ? (
        <motion.div
          key="table"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <KnowledgebaseTable
            data={knowledgebaseFiles}
            onDeleteFiles={onDeleteFiles}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            sorting={sorting}
            setSorting={setSorting}
            handleDeleteSelected={handleDeleteSelected}
            handleProcessSelected={handleProcessSelected}
            isFetchingFiles={isFetchingFiles}
          />
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <EmptyCard
            title="No files uploaded"
            className="h-[calc(100vh-350px)] w-full"
            isFetchingFiles={isFetchingFiles}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
