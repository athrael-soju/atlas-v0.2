'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useRef, useState, MutableRefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { useMessaging } from '@/hooks/use-messaging';
import {
  CornerDownLeft,
  Mic,
  Loader2,
  MessageCirclePlus,
  Save,
  BookMarked,
  ChartNoAxesCombined
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { chatFormSchema, ChatFormValues } from '@/lib/form-schema';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { ChatSidebar } from './chat-sidebar';
import { AssistantMode, ProfileSettings } from '@/types/settings';
import {
  updateAnalysisAssistant,
  updateKnowledgebaseAssistant
} from '@/lib/service/atlas';
import { toast } from '@/components/ui/use-toast';
import { TooltipButton } from './tooltip-button';
import { Message } from './message';
import { TooltipProvider } from '@/components/ui/tooltip';

const defaultValues: Partial<ChatFormValues> = {
  assistantMode: AssistantMode.Analysis
};

export const Chat = ({
  profileSettings,
  userId
}: {
  profileSettings: ProfileSettings;
  userId: string;
}) => {
  const [userInput, setUserInput] = useState('');
  const [micEnabled, setMicEnabled] = useState(false);
  const [assistantFileIds, setAssistantFileIds] = useState<string[]>([]);
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

  const assistantMode = form.watch('assistantMode') as AssistantMode;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      sendMessage(userInput, assistantMode);
      setUserInput('');
    }
  };

  const handleNewConversation = async () => {
    chatSideBarRef.current?.addConversation();
    setMessages([]);
  };

  const handleAssistantModeToggle = async () => {
    try {
      const nextMode =
        assistantMode === AssistantMode.Analysis
          ? AssistantMode.Knowledgebase
          : AssistantMode.Analysis;
      form.setValue('assistantMode', nextMode);
      if (nextMode === AssistantMode.Analysis) {
        await updateAnalysisAssistant(userId, assistantFileIds);
      } else {
        await updateKnowledgebaseAssistant(userId);
      }
      onSubmit(form.getValues());
    } catch (error) {
      toast({
        title: 'Error',
        description: String(error),
        variant: 'destructive'
      });
    }
  };

  const handleSaveChat = () => {
    const content = messages
      .map((msg) => `${msg.role}:\n${msg.text}\n`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMicToggle = () => setMicEnabled((prev) => !prev);

  const handleStop = () => abortStream();

  return (
    <TooltipProvider>
      <ChatSidebar
        ref={chatSideBarRef}
        assistantMode={assistantMode}
        setMessages={setMessages}
        userId={userId}
        setAssistantFileIds={setAssistantFileIds}
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
            <TooltipButton
              onClick={handleNewConversation}
              icon={<MessageCirclePlus className="h-5 w-5" />}
              tooltipText="New conversation"
            />
            <TooltipButton
              onClick={handleSaveChat}
              icon={<Save className="h-5 w-5" />}
              tooltipText="Save Chat"
            />
            <TooltipButton
              onClick={handleAssistantModeToggle}
              icon={
                assistantMode === AssistantMode.Knowledgebase ? (
                  <BookMarked className="h-5 w-5" />
                ) : (
                  <ChartNoAxesCombined className="h-5 w-5" />
                )
              }
              tooltipText={`Switch to ${
                assistantMode === AssistantMode.Knowledgebase
                  ? 'Analysis'
                  : 'Knowledgebase'
              } assistant`}
            />
            <TooltipButton
              onClick={handleMicToggle}
              icon={<Mic className="h-5 w-5" />}
              tooltipText="Use Microphone"
              active={micEnabled}
            />
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
