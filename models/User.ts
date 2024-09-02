import { ObjectId } from 'mongodb';

export interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    forge?: {
      parsingProvider: string;
      partitioningStrategy: string;
      chunkingStrategy: string;
      minChunkSize: number;
      maxChunkSize: number;
      chunkOverlap: number;
      chunkBatch: number;
    };
  };
  knowledgebase: {
    files: UploadedFile[];
  };
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  key: string;
  dateUploaded: string;
  dateProcessed: string;
}
