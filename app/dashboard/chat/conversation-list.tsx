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
import { Icons } from '@/components/icons';
import { Trash2, MoreHorizontal } from 'lucide-react';
import { Conversation } from '@/types/data';

type ConversationListProps = {
  conversations: Conversation[];
  handleDeleteConversation: (conversation: Conversation) => void;
  handleSetActiveConversation: (conversation: Conversation) => void;
};

export const ConversationList = ({
  conversations,
  handleDeleteConversation,
  handleSetActiveConversation
}: ConversationListProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns = React.useMemo(
    () => [
      {
        header: 'Title',
        accessorKey: 'title',
        cell: (info: any) => info.getValue()
      },
      {
        header: 'Created',
        accessorKey: 'createdAt',
        cell: (info: any) => {
          const date = new Date(info.getValue());
          return date.toLocaleDateString();
        }
      },
      {
        header: 'State',
        accessorKey: 'active',
        cell: (info: any) => {
          const isActive = info.getValue();
          return isActive ? 'Active' : 'Inactive';
        }
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }: any) => {
          const conversation = row.original;
          const isActive = conversation.active;
          return (
            <div>
              {isActive ? (
                <Button variant="ghost" className="h-8 w-8 p-0" disabled>
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              ) : (
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
                      onClick={() => handleSetActiveConversation(conversation)}
                    >
                      <Icons.check className="mr-2 h-4 w-4" />
                      Set as Active
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteConversation(conversation)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        }
      }
    ],
    [handleDeleteConversation, handleSetActiveConversation]
  );

  const table = useReactTable<Conversation>({
    data: conversations.sort((a, b) => Number(b.active) - Number(a.active)),
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
        placeholder="Filter by title..."
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
                  No conversations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
