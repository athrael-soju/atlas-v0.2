// app\dashboard\knowledgebase\uploaded-files.tsx
'use client';

import React, { Dispatch, SetStateAction } from 'react';
import {
  ColumnDef,
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
import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyCard } from '@/components/empty-card';
import type { UploadedFile } from '@/types/uploadthing';

interface UploadedFilesProps {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: Dispatch<
    SetStateAction<UploadedFile<unknown>[] | undefined>
  >;
  isFetchingFiles: boolean;
}

export function UploadedFiles({
  uploadedFiles,
  setUploadedFiles,
  isFetchingFiles
}: UploadedFilesProps) {
  const onDeleteFiles = async (files: UploadedFile[]) => {
    try {
      const response = await fetch('/api/uploadthing', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keys: files.map((file) => file.key) })
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
          description: `${result.deleteCount} file(s) have been deleted successfully`,
          variant: 'default'
        });
        setUploadedFiles(uploadedFiles.filter((file) => !files.includes(file)));
      } else {
        toast({
          title: 'Uh oh! Something went wrong.',
          description: `Some files have not been deleted`,
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

  const columns: ColumnDef<UploadedFile>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      accessorKey: 'name',
      header: 'File Name',
      cell: ({ row }) => <div className="truncate">{row.getValue('name')}</div>,
      enableSorting: true
    },
    {
      accessorKey: 'url',
      header: 'File URL',
      cell: ({ row }) => (
        <div className="truncate">
          <a
            href={row.getValue('url')}
            target="_blank"
            rel="noopener noreferrer"
          >
            {row.getValue('url')}
          </a>
        </div>
      ),
      enableSorting: true
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => {
        const sizeInBytes = parseFloat(row.getValue('size'));
        let formattedSize = '';
        let unit = 'KB';

        if (sizeInBytes >= 1024 * 1024 * 1024) {
          formattedSize = (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2);
          unit = 'GB';
        } else if (sizeInBytes >= 1024 * 1024) {
          formattedSize = (sizeInBytes / (1024 * 1024)).toFixed(2);
          unit = 'MB';
        } else {
          formattedSize = (sizeInBytes / 1024).toFixed(2);
          unit = 'KB';
        }

        return (
          <div>
            {formattedSize} {unit}
          </div>
        );
      },
      enableSorting: true
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const file = row.original;
        return (
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
      }
    }
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data: uploadedFiles,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter }
  });

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

  return (
    <>
      {uploadedFiles.length > 0 ? (
        <div className="w-full">
          <div className="flex items-center justify-between py-4">
            <Input
              placeholder="Filter by name..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
            <Button
              variant="default"
              onClick={handleDeleteSelected}
              disabled={table.getSelectedRowModel().rows.length === 0}
            >
              Delete Selected
            </Button>
          </div>
          <div
            className="overflow-y-auto rounded-md border"
            style={{ height: 'calc(44vh)' }}
          >
            <Table>
              <TableHeader>
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
                          <span
                            style={{
                              display: 'inline-block',
                              width: '1em',
                              marginLeft: '0.5em'
                            }}
                          >
                            {header.column.getIsSorted() === 'asc' ? (
                              <Icons.arrowUp className="inline-block h-3 w-3 align-middle" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <Icons.arrowDown className="inline-block h-3 w-3 align-middle" />
                            ) : (
                              <span className="inline-block align-middle">
                                ⠀
                              </span>
                            )}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
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
          </div>
        </div>
      ) : (
        <EmptyCard
          title="No files uploaded"
          className="w-full"
          style={{ height: 'calc(50vh)' }}
          isFetchingFiles={isFetchingFiles}
        />
      )}
    </>
  );
}
