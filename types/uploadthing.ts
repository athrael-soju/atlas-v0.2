import { type ClientUploadedFileData } from 'uploadthing/types';

export interface KnowledgebaseFile<T = unknown> extends ClientUploadedFileData<T> {}
