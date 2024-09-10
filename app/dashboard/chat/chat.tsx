'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { useMessaging } from '@/hooks/use-messaging';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { toast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { chatFormSchema, ChatFormValues } from '@/lib/form-schema';
import { useSession } from 'next-auth/react';
import { IUser } from '@/models/User';

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
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id;

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema),
    defaultValues
  });

  const {
    messages,
    isThinking,
    isStreaming,
    inputDisabled,
    userInputRef,
    sendMessage,
    abortStream
  } = useMessaging();

  // Watch the knowledgebaseEnabled field from form state
  const knowledgebaseEnabled = form.watch('knowledgebaseEnabled', false);

  // Fetch user settings on component load
  useEffect(() => {
    if (userId) {
      const fetchUserSettings = async () => {
        try {
          const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result?.settings?.chat) {
              form.reset(result.settings.chat); // Reset the form with the settings
            } else {
              form.reset(defaultValues);
            }
          } else {
            toast({
              title: 'Error',
              description: 'Request failed. Please try again.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: `${error}`,
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      };

      fetchUserSettings();
    }
  }, [form, userId]);

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

    // Update form state with the new knowledgebaseEnabled value
    form.setValue('knowledgebaseEnabled', !knowledgebaseEnabled);

    const partialData: Partial<IUser> = {
      settings: {
        chat: {
          knowledgebaseEnabled: !knowledgebaseEnabled
        }
      }
    };

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(partialData.settings?.chat)
      });

      if (response.ok) {
        toast({
          title: 'Settings Updated',
          description: 'Your settings have been successfully updated.',
          variant: 'default'
        });
      } else {
        // If request fails, revert the form value
        form.setValue('knowledgebaseEnabled', !knowledgebaseEnabled);
        toast({
          title: 'Error',
          description: 'Request failed. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      // Revert form value on error
      form.setValue('knowledgebaseEnabled', !knowledgebaseEnabled);
      toast({
        title: 'Error',
        description: `${error}`,
        variant: 'destructive'
      });
    }
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
        className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2"
        style={{ height: 'calc(76vh' }}
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
          className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
        >
          <Label htmlFor="message" className="sr-only">
            Message
          </Label>
          <Textarea
            id="message"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message here..."
            className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
            disabled={inputDisabled}
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
                  style={{
                    color: micEnabled ? '#f97316' : 'inherit'
                  }}
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
