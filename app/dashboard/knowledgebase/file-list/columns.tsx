import React, { ReactNode } from 'react';
import { ColumnDef, CellContext, Row } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Trash2, MoreHorizontal } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { KnowledgebaseFile } from '@/types/file-uploader';

interface CellProps {
  row: Row<KnowledgebaseFile>;
}

interface ActionsCellProps {
  row: Row<KnowledgebaseFile>;
  onDeleteFiles: (files: KnowledgebaseFile[]) => Promise<void>;
}

export function knowledgebaseColumns(
  onDeleteFiles: (files: KnowledgebaseFile[]) => Promise<void>
): ColumnDef<KnowledgebaseFile>[] {
  return [
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
      header: 'Filename',
      cell: ({ row }) => <FileNameCell row={row} />,
      enableSorting: true
    },
    {
      accessorKey: 'dateUploaded',
      header: 'Uploaded',
      cell: (info: CellContext<KnowledgebaseFile, unknown>) => info.getValue(),
      enableSorting: true
    },
    {
      accessorKey: 'dateProcessed',
      header: 'Processed',
      cell: ({ row }) => {
        return row.getValue('dateProcessed') || <div>N/A</div>;
      },
      enableSorting: true
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => <SizeCell row={row} />,
      enableSorting: true
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => <ActionsCell row={row} onDeleteFiles={onDeleteFiles} />
    }
  ];
}

const FileNameCell: React.FC<CellProps> = ({ row }) => {
  const fileName = row.getValue('name') as ReactNode;
  const fileUrl: string | undefined = row.original.url;

  return fileUrl ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-blue-500 hover:underline"
          >
            <div>{fileName}</div>
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fileName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span>{fileName}</span>
  );
};

const SizeCell: React.FC<CellProps> = ({ row }) => {
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
  }

  return (
    <div>
      {formattedSize} {unit}
    </div>
  );
};

const ActionsCell: React.FC<ActionsCellProps> = ({ row, onDeleteFiles }) => {
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
};
