'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useUserForm } from '@/hooks/use-fetch-and-submit';
import {
  conversationsFormSchema,
  ConversationsFormValues
} from '@/lib/form-schema';
import { Conversation } from '@/types/data';
import { Form } from '@/components/ui/form';

const defaultValues: Partial<ConversationsFormValues> = {
  conversations: []
};

const Conversations = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { form, userData, onSubmit, loading } = useUserForm({
    schema: conversationsFormSchema,
    defaultValues,
    formPath: 'data.conversations'
  });

  const setConversationsValue = useCallback(() => {
    if (userData) {
      form.setValue('conversations', userData);
    } else {
      form.reset(defaultValues);
    }
  }, [userData, form]);

  useEffect(() => {
    setConversationsValue();
  }, [setConversationsValue]);

  useEffect(() => {
    if (form.formState.isDirty) {
      form.handleSubmit(onSubmit)();
    }
  }, [form, onSubmit]);

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

    onSubmit({ conversations: updatedConversations });
  };

  const handleSetActiveConversation = (conversation: Conversation) => {
    // Implement logic for setting active conversation
  };

  const columns = [
    {
      header: 'Conversation',
      accessorKey: 'name',
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
      id: 'actions',
      enableHiding: false,
      cell: ({ row }: any) => {
        const conversation = row.original;
        const currentConversations = form.watch('conversations') || [];
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
                onClick={() => handleSetActiveConversation(conversation)}
                disabled={conversation.active}
              >
                <Icons.check className="mr-2 h-4 w-4" />
                Set as Active
              </DropdownMenuItem>
              {currentConversations.length > 1 && (
                <DropdownMenuItem
                  onClick={() => handleDeleteConversation(conversation)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const table = useReactTable<Conversation>({
    data: form.watch('conversations') || [],
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
                placeholder="Filter by name..."
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
};

export default Conversations;
