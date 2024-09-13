'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { useMessaging } from '@/hooks/use-messaging';
import Markdown from 'react-markdown';
import { CornerDownLeft, Mic, Paperclip, Brain, Loader2 } from 'lucide-react';
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
import { useUserForm } from '@/hooks/use-fetch-and-submit'; // Import the custom hook

const defaultValues: Partial<ChatFormValues> = {
  knowledgebaseEnabled: false
};

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
  const [micEnabled, setMicEnabled] = useState(false);
  const {
    messages,
    isThinking,
    isStreaming,
    inputDisabled,
    userInputRef,
    sendMessage,
    abortStream
  } = useMessaging();

  const { form, onSubmit } = useUserForm<ChatFormValues>({
    schema: chatFormSchema,
    defaultValues,
    formPath: 'chat'
  });

  const knowledgebaseEnabled = form.watch('knowledgebaseEnabled', false);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput, knowledgebaseEnabled);
    setUserInput('');
  };

  const handleKnowledgebaseToggle = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault(); // Prevent form submission if it triggers
    form.setValue('knowledgebaseEnabled', !knowledgebaseEnabled); // Toggle knowledgebase
    await onSubmit(form.getValues()); // Submit the form
  };

  const handleMicToggle = () => {
    setMicEnabled(!micEnabled);
  };

  const handleStop = () => {
    abortStream();
  };

  return (
    <TooltipProvider>
      <div
        className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2 "
        style={{ height: 'calc(100vh - 185px)' }}
      >
        <div className="mb-4 flex-1 space-y-4 overflow-y-auto px-4">
          {messages.map((msg, index) => (
            <Message key={index} role={msg.role} text={msg.text} />
          ))}
          {isThinking && <Spinner />}
          <div ref={userInputRef} />
          {/* <div className="flex h-full items-center justify-center">
            <div className="flex h-full items-center justify-center">
              <Image src="/atlas.png" alt="Chatting" width={100} height={100} />
            </div>
          </div> */}
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative mx-auto w-full max-w-[600px] overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
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
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={knowledgebaseEnabled}
                >
                  <Paperclip className="h-5 w-5" />
                  <span className="sr-only">Attach file</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Attach File</TooltipContent>
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

export default Chat;
