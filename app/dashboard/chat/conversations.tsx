'use client';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
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
import { ChevronLeft } from 'lucide-react';
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
import { Trash2, MoreHorizontal } from 'lucide-react';
import { Icons } from '@/components/icons';
import { toast } from '@/components/ui/use-toast';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import {
  conversationsFormSchema,
  ConversationsFormValues
} from '@/lib/form-schema';
import { Conversation } from '@/types/data';
import { Form } from '@/components/ui/form';
import * as emoji from 'node-emoji';

const defaultValues: Partial<ConversationsFormValues> = {
  conversations: []
};

export const Conversations = forwardRef((props, ref) => {
  Conversations.displayName = 'Conversations';
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { form, onSubmit } = useFetchAndSubmit({
    schema: conversationsFormSchema,
    defaultValues,
    formPath: 'data'
  });

  const handleAddConversation = async () => {
    const currentConversations = form.getValues('conversations') || [];

    const response = await fetch(`/api/assistants/threads`, {
      method: 'POST'
    });

    const { threadId } = await response.json();

    // Create a new conversation object
    const ej = emoji.random();
    const newConversation = {
      id: threadId,
      title: `${ej.emoji} ${ej.name}`,
      createdAt: new Date().toISOString(),
      active: true // Set the new conversation as active
    };

    // Update the current conversations to set the previous active one to false
    const updatedConversations = currentConversations.map((conv) => ({
      ...conv,
      active: false // Set all existing conversations to inactive
    }));

    // Add the new active conversation
    updatedConversations.push(newConversation);

    // Update the user data
    onSubmit({
      conversations: updatedConversations,
      activeConversationId: threadId
    });
  };

  // Use `useImperativeHandle` to expose functions to the parent
  useImperativeHandle(ref, () => ({
    addConversation: handleAddConversation
  }));

  const handleDeleteConversation = (conversation: Conversation) => {
    const currentConversations = form.getValues('conversations') || [];

    if (currentConversations.length <= 1 || conversation.active) {
      toast({
        title: 'Uh oh!',
        variant: 'destructive',
        description: `You can't delete an active or the only conversation.`
      });
      return;
    }

    const updatedConversations = currentConversations.filter(
      (conv) => conv.id !== conversation.id
    );

    onSubmit({
      conversations: updatedConversations,
      activeConversationId: conversation.id
    });
  };

  const handleSetActiveConversation = (conversation: Conversation) => {
    const currentConversations = form.getValues('conversations') || [];
    const updatedConversations = currentConversations.map((conv) => ({
      ...conv,
      active: conv.id === conversation.id
    }));

    onSubmit({
      conversations: updatedConversations,
      activeConversationId: conversation.id
    });
  };

  const columns = [
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
  ];

  const table = useReactTable<Conversation>({
    data: (form.watch('conversations') || []).sort(
      (a, b) => Number(b.active) - Number(a.active) // TODO: Keep?
    ),
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, globalFilter }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Sheet>
          <SheetTrigger asChild>
            <motion.button
              className="absolute right-0 top-1/2 p-2"
              style={{ transform: 'translateY(-50%)' }}
              whileHover={{ color: '#facc15' }}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
          </SheetTrigger>
          <SheetContent
            side="right"
            style={{ width: '400px', maxWidth: '100vw' }}
          >
            <SheetHeader>
              <SheetTitle>Conversations</SheetTitle>
              <SheetDescription>Select your conversation</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col space-y-4">
              <Input
                placeholder="Filter by title..."
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="mb-4"
              />

              <ScrollArea className="h-[calc(100vh-150px)] overflow-auto">
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
                        <TableRow
                          key={row.original.id}
                          className={row.original.active ? 'bg-primary' : ''}
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
      </form>
    </Form>
  );
});
