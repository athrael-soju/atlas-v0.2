import { ObjectId } from 'mongodb';
import {
  ChatSettings,
  ForgeSettings,
  KnowledgebaseSettings,
  ProfileSettings,
  MiscSettings,
  ConversationSettings
} from '@/types/settings';
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
    knowledgebase?: KnowledgebaseSettings;
    chat?: ChatSettings;
    profile?: ProfileSettings;
    misc?: MiscSettings;
  };
  knowledgebase: {
    files: UploadedFile[];
  };
  data: ConversationSettings;
}
