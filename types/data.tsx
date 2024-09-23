export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  active: boolean;
}

export interface AssistantFile {
  id: string;
  created_at: number;
  bytes: number;
  filename: string;
}
