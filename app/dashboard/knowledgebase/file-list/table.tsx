// KnowledgebaseTable.tsx
import React from 'react';
import {
  SortingState,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
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
import { KnowledgebaseFile } from '@/types/file-uploader';
import { knowledgebaseColumns } from './columns';
import { Icons } from '@/components/icons';

interface KnowledgebaseTableProps {
  data: KnowledgebaseFile[];
  onDeleteFiles: (files: KnowledgebaseFile[]) => Promise<void>;
  globalFilter: string;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  handleDeleteSelected: (selectedFiles: KnowledgebaseFile[]) => Promise<void>;
  handleProcessSelected: (selectedFiles: KnowledgebaseFile[]) => Promise<void>;
  isFetchingFiles: boolean;
}

export const KnowledgebaseTable: React.FC<KnowledgebaseTableProps> = ({
  data,
  onDeleteFiles,
  globalFilter,
  setGlobalFilter,
  sorting,
  setSorting,
  handleDeleteSelected,
  handleProcessSelected
}) => {
  const columns = knowledgebaseColumns(onDeleteFiles);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: 10 } }
  });

  const selectedFiles = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);

  return (
    <div className="w-full" style={{ height: 'calc(100vh - 350px)' }}>
      <div className="flex h-full flex-col">
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
            onClick={() => handleDeleteSelected(selectedFiles)}
            disabled={selectedFiles.length === 0}
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
            onClick={() => handleProcessSelected(selectedFiles)}
            disabled={selectedFiles.length === 0}
            className="w-full"
          >
            Process Selected
          </Button>
        </div>
      </div>
    </div>
  );
};
