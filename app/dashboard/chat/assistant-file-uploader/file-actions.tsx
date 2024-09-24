'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, CheckSquare, Square } from 'lucide-react';
import { AssistantFile } from '@/types/data';

type FileActionsProps = {
  file: AssistantFile;
  onDeleteFiles: (files: AssistantFile[]) => Promise<void>;
  onToggleActive: (file: AssistantFile) => Promise<void>; // Function to toggle active status
};

export const FileActions = ({
  file,
  onDeleteFiles,
  onToggleActive
}: FileActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>

      {/* Toggle Active Action */}
      <DropdownMenuItem onClick={() => onToggleActive(file)}>
        {file.isActive ? (
          <>
            <CheckSquare className="mr-2 h-4 w-4" />
            Deactivate
          </>
        ) : (
          <>
            <Square className="mr-2 h-4 w-4" />
            Activate
          </>
        )}
      </DropdownMenuItem>

      {/* Delete Action */}
      <DropdownMenuItem onClick={() => onDeleteFiles([file])}>
        <Trash2 color="#ba1212" className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
