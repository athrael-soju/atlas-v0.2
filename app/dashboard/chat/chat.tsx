'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/spinner';
import { useMessaging } from '@/hooks/use-messaging';
import Markdown from 'react-markdown';
import { CornerDownLeft, Mic, Paperclip } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

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
  const [knowledgebaseEnabled, setKnowledgebaseEnabled] = useState(false); // State for knowledgebase switch
  const [loading, setLoading] = useState(true); // State to track loading status
  const { messages, isThinking, inputDisabled, userInputRef, sendMessage } =
    useMessaging();

  // Fetch the current setting on component load
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const response = await fetch('/api/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Assuming the structure of the user data includes the knowledgebaseEnabled field
          setKnowledgebaseEnabled(data.settings.chat.knowledgebaseEnabled);
        } else {
          console.error('Failed to retrieve user settings');
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      } finally {
        setLoading(false); // Stop loading once the request is complete
      }
    };

    fetchUserSettings();
  }, []); // Empty dependency array means this runs once on component mount

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput, knowledgebaseEnabled);
    setUserInput('');
  };

  const handleKnowledgebaseToggle = async (checked: boolean) => {
    // Optimistically update the UI
    setKnowledgebaseEnabled(checked);

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ knowledgebaseEnabled: checked })
      });

      if (!response.ok) {
        // If the response is not OK, revert the UI update
        setKnowledgebaseEnabled(!checked);
        console.error('Failed to update knowledgebase setting');
      } else {
        // Add any other actions you want to perform when the switch is toggled
      }
    } catch (error) {
      // If there's an error, revert the UI update and log the error
      setKnowledgebaseEnabled(!checked);
      console.error('Error updating knowledgebase setting:', error);
    }
  };

  if (loading) {
    return <Spinner />; // Show a spinner or loading indicator while loading
  }

  return (
    <TooltipProvider>
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
                <Button variant="ghost" size="icon">
                  <Paperclip className="size-4" />
                  <span className="sr-only">Attach file</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Attach File</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Mic className="size-4" />
                  <span className="sr-only">Use Microphone</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Use Microphone</TooltipContent>
            </Tooltip>
            <div className="flex items-center space-x-2">
              <Switch
                id="knowledgebase-switch"
                checked={knowledgebaseEnabled}
                onCheckedChange={handleKnowledgebaseToggle} // Handle switch toggle
              />
              <Label htmlFor="knowledgebase-switch">Enlighten</Label>
            </div>
            <Button
              type="submit"
              size="sm"
              className="ml-auto gap-1.5"
              disabled={inputDisabled}
            >
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
};

export default Chat;
