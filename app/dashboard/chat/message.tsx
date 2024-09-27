import React from 'react';
import { User, Bot } from 'lucide-react';
import Markdown from 'react-markdown';

export const UserMessage = ({ text }: { text: string }) => (
  <div className="relative mb-4 flex items-center justify-end">
    <div className="flex items-start rounded-lg bg-primary p-3 text-primary-foreground shadow-lg">
      <span className="break-words">{text}</span>
    </div>
    <User className="ml-2 h-6 w-6 flex-shrink-0 text-primary" />
  </div>
);

export const AssistantMessage = ({ text }: { text: string }) => (
  <div className="relative mb-4 flex items-center justify-start">
    <Bot className="mr-2 h-6 w-6 flex-shrink-0 text-card-foreground" />
    <div className="flex items-start rounded-lg bg-card bg-muted/50 p-3 text-card-foreground shadow-lg">
      <Markdown className="break-words">{text}</Markdown>
    </div>
  </div>
);

export const CodeMessage = ({ text }: { text: string }) => (
  <div className="relative mb-4 flex items-center justify-start">
    <Bot className="mr-2 h-6 w-6 flex-shrink-0 text-card-foreground" />
    <div className="flex flex-col items-start rounded-lg bg-muted p-3 font-mono text-sm text-muted-foreground shadow-lg">
      {text.split('\n').map((line, index) => (
        <div key={index} className="flex">
          <span className="mr-2 text-muted-foreground">{`${index + 1}. `}</span>
          <span>{line}</span>
        </div>
      ))}
    </div>
  </div>
);

type MessageProps = {
  role: 'user' | 'assistant' | 'code';
  text: string;
};

export const Message = ({ role, text }: MessageProps) => {
  const MessageComponent = {
    user: UserMessage,
    assistant: AssistantMessage,
    code: CodeMessage
  }[role];

  return MessageComponent ? <MessageComponent text={text} /> : null;
};
