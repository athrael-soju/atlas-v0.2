'use client';

import React, { useState } from 'react';
import {
  SortingState,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { EmptyCard } from '@/components/empty-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';
import { processSelectedFiles } from '@/lib/service/atlas';
import { getUserData } from '@/lib/service/mongodb';
import { createColumns } from './uploaded-file-columns';
import { UploadedFile } from '@/types/file-uploader';
import { Icons } from '@/components/icons';

interface UploadedFilesProps {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<
    React.SetStateAction<UploadedFile[] | undefined>
  >;
  isFetchingFiles: boolean;
}

export function UploadedFiles({
  uploadedFiles,
  setUploadedFiles,
  isFetchingFiles
}: UploadedFilesProps) {
  const { data: session } = useSession();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const onDeleteFiles = async (files: UploadedFile[]) => {
    try {
      const userId = session?.user.id as string;
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
        setUploadedFiles(uploadedFiles.filter((file) => !files.includes(file)));
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
    }
  };

  const handleDeleteSelected = () => {
    const selectedFiles = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);
    if (selectedFiles.length > 0) {
      onDeleteFiles(selectedFiles);
    } else {
      toast({
        title: 'No files selected',
        description: 'Please select files to delete.',
        variant: 'destructive'
      });
    }
  };

  const handleProcessSelected = async () => {
    const selectedFiles = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.key) as string[];
    const userId = session?.user.id as string;

    if (selectedFiles.length > 0) {
      toast({
        title: 'Processing files',
        description: 'Selected files are being processed.',
        variant: 'default'
      });
      await processSelectedFiles(userId, selectedFiles);
      const userData = await getUserData(userId);
      const userFiles = userData.knowledgebase.files as UploadedFile[];
      setUploadedFiles(userFiles);
    } else {
      toast({
        title: 'No files selected',
        description: 'Please select files to process.',
        variant: 'default'
      });
    }
  };

  const columns = createColumns(onDeleteFiles);

  const table = useReactTable({
    data: uploadedFiles,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <>
      {uploadedFiles.length > 0 ? (
        <div className="w-full" style={{ height: 'calc(55vh)' }}>
          <div className="flex h-full flex-col">
            <div className="flex flex-shrink-0 items-center justify-between py-4">
              <Input
                placeholder="Filter by name..."
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
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
            <div className="flex-grow overflow-y-auto rounded-md border">
              <ScrollArea className="h-full rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-secondary">
                    {table.getHeaderGroups().map((headerGroup) => (
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
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
              <span>
                Page{' '}
                <strong>
                  {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </strong>
              </span>
            </div>
            <div className="mt-2 flex-shrink-0">
              <Button
                type="button"
                variant="default"
                onClick={handleProcessSelected}
                disabled={table.getSelectedRowModel().rows.length === 0}
                className="w-full"
              >
                Process Selected
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyCard
          title="No files uploaded"
          className="w-full"
          style={{ height: 'calc(55vh)' }}
          isFetchingFiles={isFetchingFiles}
        />
      )}
    </>
  );
}
