'use client';

import React, { useState } from 'react';
import Dropzone, { FileRejection } from 'react-dropzone';
import { toast } from '@/components/ui/use-toast';
import {
  SortingState,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel
} from '@tanstack/react-table';

import { cn, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AssistantFile } from '@/types/data';
import { Icons } from '@/components/icons';
import {
  assistantFilesFormSchema,
  AssistantFilesFormValues
} from '@/lib/form-schema';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Working } from '@/components/spinner';

const defaultValues: Partial<AssistantFilesFormValues> = {
  analysis: []
};

type AssistantUploaderProps = {
  userId: string;
};

const FileDropzone = ({ onDrop, isUploading }: any) => (
  <Dropzone onDrop={onDrop}>
    {({ getRootProps, getInputProps, isDragActive }) => (
      <div
        {...getRootProps()}
        className={cn(
          'h-42 group relative grid w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragActive && 'border-muted-foreground/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
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
              You can upload multiple files
            </p>
          </div>
        </div>
      </div>
    )}
  </Dropzone>
);

const FileActions = ({ file, onDeleteFiles }: any) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onDeleteFiles([file])}>
        <Trash2 color="#ba1212" className="mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const FileTable = ({ table, working, assistantColumns }: any) => (
  <div className="rounded-md border">
    <ScrollArea style={{ height: 'calc(100vh - 345px)' }}>
      <Table>
        <TableHeader>
          {table
            .getHeaderGroups()
            .map(
              (headerGroup: {
                id: React.Key | null | undefined;
                headers: any[];
              }) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={
                        header.column.getCanSort()
                          ? 'cursor-pointer select-none'
                          : ''
                      }
                    >
                      <div className="flex items-center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className="ml-2 inline-block">
                          {header.column.getIsSorted() === 'asc' ? (
                            <Icons.arrowUp className="inline-block h-3 w-3 align-middle" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <Icons.arrowDown className="inline-block h-3 w-3 align-middle" />
                          ) : (
                            <div className="inline-block h-3 w-3 align-middle opacity-0" />
                          )}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              )
            )}
        </TableHeader>
        <TableBody>
          {working ? (
            <TableRow>
              <TableCell colSpan={assistantColumns.length}>
                <div className="flex h-[calc(100vh-450px)] items-center justify-center">
                  <Working />
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table
              .getRowModel()
              .rows.map(
                (row: {
                  id: React.Key | null | undefined;
                  getIsSelected: () => any;
                  getVisibleCells: () => any[];
                }) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
          ) : (
            <TableRow>
              <TableCell colSpan={assistantColumns.length}>
                No files found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  </div>
);

export const AssistantFileUploader = ({ userId }: AssistantUploaderProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [working, setWorking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { form, onSubmit } = useFetchAndSubmit<AssistantFilesFormValues>({
    schema: assistantFilesFormSchema,
    defaultValues,
    formPath: 'files'
  });

  const assistantFiles = form.getValues('analysis') || [];

  const handleUpdateFiles = async (
    acceptedFiles: File[],
    rejectedFiles: FileRejection[]
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
          onSubmit({ analysis: assistantFiles.concat(data.assistantFiles) });
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
            (e) => e.message
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
        onSubmit({
          analysis: assistantFiles.filter((file) => !files.includes(file))
        });
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

  const handleDeleteSelected = async () => {
    const selectedFiles = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);
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
      cell: ({ row }: any) =>
        new Date(row.original.created_at).toLocaleDateString()
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <FileActions file={row.original} onDeleteFiles={onDeleteFiles} />
      )
    }
  ];

  const table = useReactTable({
    data: assistantFiles,
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
