import { ObjectId } from 'mongodb';
import { ForgeSettings } from '@/types/forge';
import { UploadedFile } from '@/types/file-uploader';

export interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    forge?: ForgeSettings;
  };
  knowledgebase: {
    files: UploadedFile[];
  };
}
