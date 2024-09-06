'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { useMessaging } from '@/hooks/use-messaging';
import Markdown from 'react-markdown';
import {
  CornerDownLeft,
  Mic,
  Paperclip,
  Brain,
  StopCircle
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
  const [knowledgebaseEnabled, setKnowledgebaseEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isStopped, setIsStopped] = useState(false); // New state for stopping the assistant

  const {
    messages,
    isThinking,
    inputDisabled,
    userInputRef,
    sendMessage,
    abortStream
  } = useMessaging();

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
          setKnowledgebaseEnabled(data.settings.chat.knowledgebaseEnabled);
        } else {
          console.error('Failed to retrieve user settings');
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, []);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    setIsStopped(false); // Reset the stopped state
    sendMessage(userInput, knowledgebaseEnabled);
    setUserInput('');
  };

  const handleKnowledgebaseToggle = async () => {
    const newValue = !knowledgebaseEnabled;
    setKnowledgebaseEnabled(newValue);

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ knowledgebaseEnabled: newValue })
      });

      if (!response.ok) {
        setKnowledgebaseEnabled(!newValue);
        console.error('Failed to update knowledgebase setting');
      }
    } catch (error) {
      setKnowledgebaseEnabled(!newValue);
      console.error('Error updating knowledgebase setting:', error);
    }
  };

  const handleMicToggle = () => {
    setMicEnabled(!micEnabled);
  };

  const handleStop = () => {
    abortStream(); // This function should be provided by useMessaging to stop the assistant
    setIsStopped(true);
  };

  return (
    <TooltipProvider>
      <div
        className="flex flex-col rounded-lg border bg-white p-4 shadow dark:bg-gray-900"
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
                    color: micEnabled ? '#f97316' : 'inherit' // Orange color when active
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
                  style={{
                    color: knowledgebaseEnabled ? '#facc15' : 'inherit'
                  }}
                >
                  <Brain className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">Toggle Enlighten</TooltipContent>
            </Tooltip>
            <Button
              type="submit"
              size="sm"
              className="ml-auto gap-1.5"
              disabled={inputDisabled || isThinking}
            >
              Send Message
              <CornerDownLeft className="h-4 w-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive" // Assuming a 'destructive' variant exists
                  className="ml-2 gap-1.5"
                  onClick={handleStop}
                  disabled={isThinking || isStopped} // Disable if not thinking or already stopped
                >
                  Stop
                  <StopCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Stop Message</TooltipContent>
            </Tooltip>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
};

export default Chat;
