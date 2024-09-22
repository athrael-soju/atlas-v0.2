import { ObjectId } from 'mongodb';
import {
  ChatSettings,
  ForgeSettings,
  KnowledgebaseSettings,
  ProfileSettings,
  MiscSettings,
  ConversationSettings
} from '@/types/settings';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { FileObject } from 'openai/resources/files.mjs';

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
  files: {
    knowledgebase: KnowledgebaseFile[];
    analysis: FileObject[];
  };
  data: ConversationSettings;
}
