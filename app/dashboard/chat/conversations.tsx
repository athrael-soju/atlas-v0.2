'use client';

import React, { useState } from 'react';
import {
  SortingState,
  useReactTable,
  flexRender,
  getCoreRowModel,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Trash2, MoreHorizontal } from 'lucide-react'; // Icons
import { Icons } from '@/components/icons';

// Initial mock data for saved conversations
const initialConversations = [
  { id: 1, name: 'Chat with Support', dateCreated: '2024-09-12' },
  { id: 2, name: 'Project Brainstorm', dateCreated: '2024-09-10' },
  { id: 3, name: 'Daily Standup', dateCreated: '2024-09-09' },
  { id: 4, name: 'Client Discussion', dateCreated: '2024-09-08' },
  { id: 5, name: 'Team Meeting', dateCreated: '2024-09-07' }
];

const Conversations = () => {
  const [conversations, setConversations] = useState(initialConversations); // State for conversations
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Function to handle deletion
  const handleDeleteConversation = (conversation: any) => {
    setConversations((prev) =>
      prev.filter((conv) => conv.id !== conversation.id)
    );
  };

  // Define columns for the table
  const columns = [
    {
      header: 'Conversation',
      accessorKey: 'name',
      cell: (info: any) => info.getValue()
    },
    {
      header: 'Date Created',
      accessorKey: 'dateCreated',
      cell: (info: any) => info.getValue()
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }: any) => {
        const conversation = row.original;
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
                onClick={() => handleDeleteConversation(conversation)}
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

  const table = useReactTable({
    data: conversations,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter }
  });

  return (
    <>
      {/* The button that triggers the retractable sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <motion.button
            className="absolute right-0 top-1/2 p-2"
            style={{ transform: 'translateY(-50%)' }}
            whileHover={{ color: '#facc15' }}
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </SheetTrigger>

        {/* The sheet content that appears when the button is clicked */}
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Conversations</SheetTitle>
            <SheetDescription>Select your conversation</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col space-y-4">
            <Input
              placeholder="Filter by name..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="mb-4"
            />

            {/* Scrollable Table */}
            <ScrollArea className="h-[300px]">
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
                            <span className="ml-2">
                              {header.column.getIsSorted() === 'asc' ? (
                                <Icons.arrowUp className="h-3 w-3" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <Icons.arrowDown className="h-3 w-3" />
                              ) : (
                                <Icons.arrowUp className="h-3 w-3 opacity-0" /> // Invisible arrow for alignment
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
                      <TableRow key={row.id}>
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
                        className="text-center"
                      >
                        No conversations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Conversations;
