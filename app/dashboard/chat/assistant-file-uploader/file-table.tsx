'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flexRender } from '@tanstack/react-table';
import { Working } from '@/components/spinner';
import { Icons } from '@/components/icons';

type FileTableProps = {
  table: any;
  working: boolean;
  assistantColumns: any[];
};

export const FileTable = ({
  table,
  working,
  assistantColumns
}: FileTableProps) => (
  <div className="rounded-md border">
    <ScrollArea style={{ height: 'calc(100vh - 345px)' }}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup: any) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header: any) => (
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
          {working ? (
            <TableRow>
              <TableCell colSpan={assistantColumns.length}>
                <div className="flex h-[calc(100vh-400px)] items-center justify-center">
                  <Working />
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row: any) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={row.original.isActive ? 'bg-muted' : ''}
              >
                {row.getVisibleCells().map((cell: any) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
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
