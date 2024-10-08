'use client';

import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  SortingState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel
} from '@tanstack/react-table';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AssistantFile } from '@/types/data';
import { Input } from '@/components/ui/input';
import { FileDropzone } from './file-dropzone';
import { FileActions } from './file-actions';
import { FileTable } from './file-table';
import { updateAnalysisAssistant } from '@/lib/service/atlas';

type AssistantUploaderProps = {
  userId: string;
  setAssistantFileIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export const AssistantFileUploader = ({
  userId,
  setAssistantFileIds
}: AssistantUploaderProps) => {
  const [assistantFileList, setAssistantFileList] = useState<AssistantFile[]>(
    []
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [working, setWorking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch assistant files when the component mounts
  useEffect(() => {
    const fetchAssistantFiles = async () => {
      try {
        const response = await fetch(
          `/api/assistants/files/analysis?userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setAssistantFileList(data.files);
        } else {
          const errorData = await response.json();
          toast({
            title: 'Error fetching files',
            description: `${errorData.error}`,
            variant: 'destructive'
          });
        }
      } catch (error) {
        toast({
          title: 'Error fetching files',
          description: `${error}`,
          variant: 'destructive'
        });
      }
    };

    fetchAssistantFiles();
  }, [userId]);

  const handleUpdateFiles = async (
    acceptedFiles: File[],
    rejectedFiles: any[]
  ) => {
    if (acceptedFiles.length > 0) {
      setIsUploading(true);
      setWorking(true);
      const formData = new FormData();
      acceptedFiles.forEach((file) => formData.append('files', file));
      formData.append('userId', userId);

      try {
        const response = await fetch('/api/assistants/files/analysis', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          // Update the assistantFileList
          setAssistantFileList(assistantFileList.concat(data.assistantFiles));

          toast({
            title: 'Files uploaded successfully',
            description: `${acceptedFiles.length} file(s) have been uploaded`,
            variant: 'default'
          });
        } else {
          const errorData = await response.json();
          toast({
            title: 'Uh oh! Something went wrong.',
            description: `${errorData.error}`,
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
        setIsUploading(false);
      }
    }

    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        toast({
          title: 'Uh oh! Something went wrong.',
          description: `File ${file.name} was rejected: ${errors.map(
            (e: any) => e.message
          )}`,
          variant: 'destructive'
        });
      });
    }
  };

  const onDeleteFiles = async (files: AssistantFile[]) => {
    try {
      setWorking(true);
      const response = await fetch('/api/assistants/files/analysis', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, files })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete files');
      }

      const result = await response.json();
      if (result.deletedFiles.length > 0) {
        toast({
          title: 'Done!',
          description: `${result.deletedFileCount} file(s) have been deleted successfully`,
          variant: 'default'
        });

        // Update assistantFileList
        setAssistantFileList(
          assistantFileList.filter(
            (file) => !files.some((f) => f.id === file.id)
          )
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
      // Update the analysis assistant with the filtered file IDs
      const filteredFileIds = assistantFileList
        .filter((file) => !files.includes(file))
        .map((f) => f.id);
      await updateAnalysisAssistant(userId, filteredFileIds);
      setWorking(false);
    }
  };

  const onToggleActive = async (file: AssistantFile) => {
    try {
      setWorking(true);
      const updatedFile = { ...file, isActive: !file.isActive };

      // Create a new assistantFileList with the updatedFile
      const updatedAssistantFileList = assistantFileList.map((f) =>
        f.id === file.id ? updatedFile : f
      );

      // Update assistantFileList
      setAssistantFileList(updatedAssistantFileList);

      // Now use the updatedAssistantFileList for filtering active files
      const fileIds: string[] = updatedAssistantFileList
        .filter((f) => f.isActive)
        .map((f) => f.id);

      // Update the analysis assistant with active file IDs
      setAssistantFileIds(fileIds);
      const response = await updateAnalysisAssistant(userId, fileIds);

      if (response?.ok) {
        toast({
          title: 'Done!',
          description: `${file.filename} has been ${
            updatedFile.isActive ? 'added to' : 'removed from'
          } the analysis data set`,
          variant: 'default'
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

  const handleDeleteSelected = async () => {
    const selectedFiles = table
      .getSelectedRowModel()
      .rows.map((row: any) => row.original);
    if (selectedFiles.length > 0) {
      await onDeleteFiles(selectedFiles);
    } else {
      toast({
        title: 'No files selected',
        description: 'Please select files to delete.',
        variant: 'destructive'
      });
    }
  };

  const assistantColumns = [
    {
      id: 'select',
      header: ({ table }: any) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      )
    },
    {
      accessorKey: 'filename',
      header: 'Filename',
      cell: ({ row }: any) => row.original.filename
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }: any) => formatBytes(row.original.bytes)
    },
    {
      accessorKey: 'created_at',
      header: 'Uploaded',
      cell: ({ row }: any) => row.original.created_at
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <FileActions
          file={row.original}
          onDeleteFiles={onDeleteFiles}
          onToggleActive={onToggleActive}
        />
      )
    }
  ];

  const table = useReactTable({
    data: assistantFileList,
    columns: assistantColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <div>
      <FileDropzone onDrop={handleUpdateFiles} isUploading={isUploading} />

      <div className="file-table mt-6">
        <div className="flex flex-shrink-0 items-center justify-between space-x-4 py-4">
          <Input
            placeholder="Filter by name..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="min-w-0 max-w-full flex-grow sm:max-w-sm"
          />
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={table.getSelectedRowModel().rows.length === 0}
            className="mr-2"
          >
            Delete Selected
          </Button>
        </div>

        <FileTable
          table={table}
          working={working}
          assistantColumns={assistantColumns}
        />
      </div>
    </div>
  );
};
