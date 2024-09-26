import { type DropzoneProps } from 'react-dropzone';

export interface FileUploaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Value of the uploader.
   * @type File[]
   * @default undefined
   * @example value={files}
   */
  value?: File[];

  /**
   * Function to be called when the value changes.
   * @type (files: File[]) => void
   * @default undefined
   * @example onValueChange={(files) => setFiles(files)}
   */
  onValueChange?: (files: File[]) => void;

  /**
   * Function to be called when files are uploaded.
   * @type (files: File[]) => Promise<void>
   * @default undefined
   * @example onUpload={(files) => uploadFiles(files)}
   */
  onUpload?: (files: File[]) => Promise<void>;

  /**
   * Progress of the uploaded files.
   * @type Record<string, number> | undefined
   * @default undefined
   * @example progress={{ "file1.png": 50 }}
   */
  progress?: Record<string, number>;

  /**
   * Accepted file types for the uploader.
   * @type { [key: string]: string[]}
   * @default
   * ```ts
   * { "image/*": [] }
   * ```
   * @example accept={["image/png", "image/jpeg"]}
   */
  accept?: DropzoneProps['accept'];

  /**
   * Maximum file size for the uploader.
   * @type number | undefined
   * @default 1024 * 1024 * 2 // 2MB
   * @example maxSize={1024 * 1024 * 2} // 2MB
   */
  maxSize?: DropzoneProps['maxSize'];

  /**
   * Maximum number of files for the uploader.
   * @type number | undefined
   * @default 1
   * @example maxFileCount={4}
   */
  maxFileCount?: DropzoneProps['maxFiles'];

  /**
   * Whether the uploader should accept multiple files.
   * @type boolean
   * @default false
   * @example multiple
   */
  multiple?: boolean;

  /**
   * Whether the uploader is disabled.
   * @type boolean
   * @default false
   * @example disabled
   */
  disabled?: boolean;
}

export interface FilePreviewProps {
  file: File & { preview: string };
}

export interface FileCardProps {
  file: File;
  onRemove: () => void;
  progress?: number;
}

export interface KnowledgebaseFile {
  name: string;
  url: string;
  size: number;
  key: string;
  dateUploaded: string;
  dateProcessed: string;
}

export interface KnowledgebaseFilesProps {
  knowledgebaseFiles: KnowledgebaseFile[];
  setKnowledgebaseFiles: React.Dispatch<
    React.SetStateAction<KnowledgebaseFile[] | undefined>
  >;
  isFetchingFiles: boolean;
  working: boolean;
  setWorking: React.Dispatch<React.SetStateAction<boolean>>;
  isUploading: boolean;
}
