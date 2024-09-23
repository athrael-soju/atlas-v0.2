'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useRef, useState, MutableRefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { useMessaging } from '@/hooks/use-messaging';
import Markdown from 'react-markdown';
import {
  CornerDownLeft,
  Mic,
  Brain,
  Loader2,
  User,
  Bot,
  MessageCirclePlus,
  Save
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { chatFormSchema, ChatFormValues } from '@/lib/form-schema';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { ChatSidebar } from './chat-sidebar';
import { ProfileSettings } from '@/types/settings';

const defaultValues: Partial<ChatFormValues> = {
  knowledgebaseEnabled: false
};

type MessageProps = {
  role: 'user' | 'assistant' | 'code';
  text: string;
};

const UserMessage = ({ text }: { text: string }) => (
  <div className="relative mb-4 flex items-center justify-end">
    <div className="flex items-start rounded-lg bg-primary p-3 text-primary-foreground shadow-lg">
      <span className="break-words">{text}</span>
    </div>
    <div className="ml-2">
      <User className="h-6 w-6 flex-shrink-0 text-primary" />
    </div>
  </div>
);

const AssistantMessage = ({ text }: { text: string }) => (
  <div className="relative mb-4 flex items-center justify-start">
    <Bot className="mr-2 h-6 w-6 flex-shrink-0 text-card-foreground" />
    <div className="flex items-start rounded-lg bg-card bg-muted/50 p-3 text-card-foreground shadow-lg">
      <Markdown className="break-words">{text}</Markdown>
    </div>
  </div>
);

const CodeMessage = ({ text }: { text: string }) => (
  <div className="relative mb-4 flex items-center justify-start">
    <Bot className="mr-2 h-8 w-8 flex-shrink-0 text-muted-foreground" />
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

type ChatProps = {
  profileSettings: ProfileSettings;
};

export const Chat = ({ profileSettings }: ChatProps) => {
  const [userInput, setUserInput] = useState('');
  const [micEnabled, setMicEnabled] = useState(false);
  const chatSideBarRef = useRef() as MutableRefObject<{
    addConversation: () => void;
  } | null>;
  const {
    messages,
    setMessages,
    isThinking,
    isStreaming,
    inputDisabled,
    userInputRef,
    sendMessage,
    abortStream
  } = useMessaging(profileSettings);

  const { form, onSubmit } = useFetchAndSubmit<ChatFormValues>({
    schema: chatFormSchema,
    defaultValues,
    formPath: 'settings.chat'
  });

  const knowledgebaseEnabled = form.watch('knowledgebaseEnabled', false);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput, knowledgebaseEnabled);
    setUserInput('');
  };

  const handleStartNewConversation = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (chatSideBarRef.current) {
      chatSideBarRef.current.addConversation();
    }
    setMessages([]);
  };

  const handleKnowledgebaseToggle = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    form.setValue('knowledgebaseEnabled', !knowledgebaseEnabled);
    onSubmit(form.getValues());
  };

  const handleMicToggle = () => {
    setMicEnabled(!micEnabled);
  };

  const handleStop = () => {
    abortStream();
  };

  // New function to handle saving the chat
  const handleSaveChat = () => {
    // Format messages into text content
    const content = messages
      .map((msg) => {
        const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
        return `${role}:\n${msg.text}\n`;
      })
      .join('\n');

    // Create a Blob with the content
    const blob = new Blob([content], { type: 'text/plain' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary <a> element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Release the URL object
    URL.revokeObjectURL(url);
  };
  // TODO: Add an icon for Analysis assistant and link it to active files
  return (
    <TooltipProvider>
      <ChatSidebar
        ref={chatSideBarRef}
        knowledgebaseEnabled={knowledgebaseEnabled}
        setMessages={setMessages}
      />
      <div
        className="relative flex h-full min-h-[50vh] flex-col items-center rounded-xl p-4 lg:col-span-2"
        style={{ height: 'calc(100vh - 185px)' }}
      >
        <ScrollArea
          className="mb-4 w-full max-w-[800px] flex-1 rounded-xl pr-4"
          style={{
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '16px'
          }}
        >
          {messages.map((msg, index) => (
            <div key={index} className="mx-auto max-w-full">
              <Message role={msg.role} text={msg.text} />
            </div>
          ))}
          {isThinking && <Spinner />}
          <div ref={userInputRef} />
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-[800px] overflow-hidden rounded-lg border bg-background bg-muted/50 focus-within:ring-1 focus-within:ring-ring"
        >
          <Label htmlFor="message" className="sr-only">
            Message
          </Label>
          <Textarea
            id="message"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Send a message..."
            className="min-h-12 w-full resize-none border-0 p-3 shadow-none focus-visible:ring-0"
            disabled={inputDisabled}
            rows={1}
          />
          <div className="flex items-center p-3 pt-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={handleStartNewConversation}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-full p-2 focus:outline-none"
                  type="button"
                >
                  <MessageCirclePlus className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">New conversation</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={handleSaveChat}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-full p-2 focus:outline-none"
                  type="button"
                >
                  <Save className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">Save Chat</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={handleKnowledgebaseToggle}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-full p-2 focus:outline-none"
                  type="button"
                  style={{
                    color: knowledgebaseEnabled ? '#facc15' : 'inherit'
                  }}
                >
                  <Brain className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Enlighten your assistant
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={handleMicToggle}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-full p-2 focus:outline-none"
                  style={{ color: micEnabled ? '#f97316' : 'inherit' }}
                >
                  <Mic className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">Use Microphone</TooltipContent>
            </Tooltip>
            <Button
              type="button"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={isThinking || isStreaming ? handleStop : handleSubmit}
              disabled={inputDisabled || userInput.trim() === ''}
            >
              {isThinking || isStreaming || inputDisabled ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Stop Response
                </>
              ) : (
                <>
                  Send Message
                  <CornerDownLeft className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
};
