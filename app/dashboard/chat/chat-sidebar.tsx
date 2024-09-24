// chatSideBarRef.tsx
'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { Form } from '@/components/ui/form';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { conversationsFormSchema } from '@/lib/form-schema';
import { Conversation } from '@/types/data';
import * as emoji from 'node-emoji';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ConversationList } from './conversation-list';
import { AssistantFileUploader } from './assistant-file-uploader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { AssistantMode } from '@/types/settings';
import { getLocalDateTime } from '@/lib/utils';

const defaultValues = {
  conversations: []
};

type ChatSidebarProps = {
  assistantMode: AssistantMode;
  setMessages: React.Dispatch<React.SetStateAction<any>>;
  setAssistantFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  userId: string;
};

export const ChatSidebar = forwardRef<unknown, ChatSidebarProps>(
  (props, ref) => {
    const { assistantMode, setMessages, userId, setAssistantFileIds } = props;
    ChatSidebar.displayName = 'ChatSidebar';

    const { form, onSubmit } = useFetchAndSubmit({
      schema: conversationsFormSchema,
      defaultValues,
      formPath: 'data'
    });

    const handleAddConversation = async () => {
      const currentConversations = form.getValues('conversations') || [];

      const response = await fetch(`/api/assistants/threads`, {
        method: 'POST'
      });

      const { threadId } = await response.json();

      // Create a new conversation object
      const ej = emoji.random();
      const newConversation = {
        id: threadId,
        title: `${ej.emoji} ${ej.name}`,
        createdAt: getLocalDateTime(),
        active: true // Set the new conversation as active
      };

      // Update the current conversations to set the previous active one to false
      const updatedConversations = currentConversations.map((conv) => ({
        ...conv,
        active: false // Set all existing conversations to inactive
      }));

      // Add the new active conversation
      updatedConversations.push(newConversation);

      // Update the user data
      onSubmit({
        conversations: updatedConversations,
        activeConversationId: threadId
      });
    };

    useImperativeHandle(ref, () => ({
      addConversation: handleAddConversation
    }));

    const handleDeleteConversation = (conversation: Conversation) => {
      const currentConversations = form.getValues('conversations') || [];

      if (currentConversations.length <= 1 || conversation.active) {
        toast({
          title: 'Uh oh!',
          variant: 'destructive',
          description: `You can't delete an active or the only conversation.`
        });
        return;
      }

      const updatedConversations = currentConversations.filter(
        (conv) => conv.id !== conversation.id
      );

      onSubmit({
        conversations: updatedConversations,
        activeConversationId: conversation.id
      });
    };

    const handleSetActiveConversation = (conversation: Conversation) => {
      const currentConversations = form.getValues('conversations') || [];
      const updatedConversations = currentConversations.map((conv) => ({
        ...conv,
        active: conv.id === conversation.id
      }));

      onSubmit({
        conversations: updatedConversations,
        activeConversationId: conversation.id
      });
      setMessages([]);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Sheet aria-describedby={undefined}>
            <SheetTrigger asChild>
              <motion.button
                className="absolute right-0 top-1/2 p-2"
                style={{
                  transform: 'translateY(-50%)',
                  color: 'hsl(210, 10%, 40%)'
                }}
                whileHover={{
                  color: 'hsl(50, 100%, 60%)'
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.button>
            </SheetTrigger>
            <SheetContent
              side="right"
              style={{ width: '450px', maxWidth: '100vw' }}
            >
              <VisuallyHidden>
                <SheetHeader>
                  <SheetTitle>Manage your </SheetTitle>
                  <SheetDescription>Select your conversation</SheetDescription>
                </SheetHeader>
              </VisuallyHidden>

              <Tabs defaultValue="conversations" className="w-full">
                <TabsList className="my-4 flex justify-around">
                  <TabsTrigger value="conversations">Conversations</TabsTrigger>
                  <TabsTrigger
                    value="files"
                    disabled={assistantMode === AssistantMode.Knowledgebase}
                  >
                    Assistant Files
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="conversations">
                  <ConversationList
                    conversations={form.watch('conversations') || []}
                    handleDeleteConversation={handleDeleteConversation}
                    handleSetActiveConversation={handleSetActiveConversation}
                  />
                </TabsContent>

                <TabsContent value="files">
                  <AssistantFileUploader
                    userId={userId}
                    setAssistantFileIds={setAssistantFileIds}
                  />
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </form>
      </Form>
    );
  }
);
