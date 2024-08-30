// app/dashboard/knowledgebase/uploaded-files.tsx
'use client';

import React, { Dispatch, SetStateAction } from 'react';
import {
  ColumnDef,
  SortingState,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel
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
  setUploadedFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  isFetchingFiles: boolean;
}

export function UploadedFiles({
  uploadedFiles,
  setUploadedFiles,
  isFetchingFiles
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
      cell: ({ row }) => <div className="truncate">{row.getValue('name')}</div>
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
      )
    },
    {
      accessorKey: 'size',
      header: 'Size (KB)',
      cell: ({ row }) => {
        const size = parseFloat(row.getValue('size'));
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'decimal',
          maximumFractionDigits: 2
        }).format(size / 1024);
        return <div>{formatted} KB</div>;
      }
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
              <DropdownMenuItem
                onClick={() => onDeleteFile(file.name, file.key)}
              >
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
  const table = useReactTable({
    data: uploadedFiles,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting }
  });

  return (
    <>
      {uploadedFiles.length > 0 ? (
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter by name..."
              value={
                (table.getColumn('name')?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table.getColumn('name')?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div
            className="overflow-y-auto rounded-md border"
            style={{ height: 'calc(50vh)' }}
          >
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
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
