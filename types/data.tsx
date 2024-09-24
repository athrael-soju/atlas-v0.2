export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  active: boolean;
}

export interface AssistantFile {
  id: string;
  created_at: string;
  bytes: number;
  filename: string;
  isActive: boolean;
}
