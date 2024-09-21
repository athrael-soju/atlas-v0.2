import React from 'react';
import {
  SortingState,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel
} from '@tanstack/react-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Trash2, MoreHorizontal } from 'lucide-react';
import { Icons } from '@/components/icons';

type FileData = {
  id: string;
  fileName: string;
  uploadDate: string;
  size: string;
};

type FileListProps = {
  files: FileData[];
  handleDeleteFile: (file: FileData) => void;
};

const mockFiles: FileData[] = Array.from({ length: 15 }, (_, i) => ({
  id: (i + 1).toString(),
  fileName: `file_${i + 1}.pdf`,
  uploadDate: new Date().toLocaleDateString(),
  size: `${(Math.random() * 10).toFixed(2)} MB`
}));

export const FileList = ({
  files = mockFiles, // Fallback to mock files if no files are provided
  handleDeleteFile
}: FileListProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns = React.useMemo(
    () => [
      {
        header: 'File Name',
        accessorKey: 'fileName',
        cell: (info: any) => info.getValue()
      },
      {
        header: 'Uploaded',
        accessorKey: 'uploadDate',
        cell: (info: any) => info.getValue()
      },
      {
        header: 'Size',
        accessorKey: 'size',
        cell: (info: any) => info.getValue()
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }: any) => {
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
                <DropdownMenuItem onClick={() => handleDeleteFile(file)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
      }
    ],
    [handleDeleteFile]
  );

  const table = useReactTable<FileData>({
    data: files.length > 0 ? files : mockFiles, // Use mockFiles if files is empty
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter }
  });

  return (
    <div className="flex h-full flex-col space-y-4">
      <Input
        placeholder="Filter by file name..."
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="mb-4"
      />

      <ScrollArea style={{ height: 'calc(100vh - 185px)' }}>
        <Table className="w-full">
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
                    style={{ width: '200px' }}
                  >
                    <div className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span className="ml-2">
                        {header.column.getIsSorted() === 'asc' ? (
                          <Icons.arrowUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <Icons.arrowDown className="h-3 w-3" />
                        ) : (
                          <Icons.arrowUp className="h-3 w-3 opacity-0" />
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
                <TableRow key={row.original.id}>
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
                <TableCell colSpan={columns.length} className="text-center">
                  No files found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
