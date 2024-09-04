'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/spinner';
import { useMessaging } from '@/hooks/use-messaging';
import Markdown from 'react-markdown';

type MessageProps = {
  role: 'user' | 'assistant' | 'code';
  text: string;
};

const UserMessage = ({ text }: { text: string }) => (
  <div className="rounded-lg bg-primary p-3 text-primary-foreground">
    {text}
  </div>
);

const AssistantMessage = ({ text }: { text: string }) => (
  <div className="rounded-lg bg-card p-3 text-card-foreground">
    <Markdown>{text}</Markdown>
  </div>
);

const CodeMessage = ({ text }: { text: string }) => (
  <div className="rounded-lg bg-muted p-3 font-mono text-sm text-muted-foreground">
    {text.split('\n').map((line, index) => (
      <div key={index} className="flex">
        <span className="mr-2 text-muted-foreground">{`${index + 1}. `}</span>
        <span>{line}</span>
      </div>
    ))}
  </div>
);

const Message = ({ role, text }: MessageProps) => {
  switch (role) {
    case 'user':
      return <UserMessage text={text} />;
    case 'assistant':
      return <AssistantMessage text={text} />;
    case 'code':
      return <CodeMessage text={text} />;
    default:
      return null;
  }
};

const Chat = () => {
  const [userInput, setUserInput] = useState('');
  const {
    messages,
    isThinking,
    inputDisabled,
    userInputRef,
    sendMessage,
    setUserInputDisabled
  } = useMessaging();

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput);
    setUserInput('');
  };

  return (
    <div
      className="flex flex-col rounded-lg border bg-white p-4 shadow dark:bg-gray-900"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto px-4">
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} text={msg.text} />
        ))}
        {isThinking && <Spinner />}
        <div ref={userInputRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center space-x-4 border-t pt-4"
      >
        <Input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask anything!"
          disabled={inputDisabled}
        />

        <Button disabled={inputDisabled}>Send</Button>
      </form>
    </div>
  );
};

export default Chat;
