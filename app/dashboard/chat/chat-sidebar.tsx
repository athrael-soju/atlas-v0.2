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
  ({ assistantMode, setMessages, userId, setAssistantFileIds }, ref) => {
    ChatSidebar.displayName = 'ChatSidebar';

    const { form, onSubmit } = useFetchAndSubmit({
      schema: conversationsFormSchema,
      defaultValues,
      formPath: 'data'
    });

    const updateConversations = (
      newConversations: Conversation[],
      activeId: string
    ) => {
      onSubmit({
        conversations: newConversations,
        activeConversationId: activeId
      });
    };

    const handleAddConversation = async () => {
      const currentConversations = form.getValues('conversations') || [];
      const { threadId } = await (
        await fetch(`/api/assistants/threads`, { method: 'POST' })
      ).json();
      const newEmoji = emoji.random();

      const newConversation = {
        id: threadId,
        title: `${newEmoji.emoji} ${newEmoji.name}`,
        createdAt: getLocalDateTime(),
        active: true
      };

      const updatedConversations = currentConversations.map((conv) => ({
        ...conv,
        active: false
      }));

      updatedConversations.push(newConversation);
      updateConversations(updatedConversations, threadId);
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
      updateConversations(updatedConversations, conversation.id);
    };

    const handleSetActiveConversation = (conversation: Conversation) => {
      const currentConversations = form.getValues('conversations') || [];
      const updatedConversations = currentConversations.map((conv) => ({
        ...conv,
        active: conv.id === conversation.id
      }));

      updateConversations(updatedConversations, conversation.id);
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
                whileHover={{ color: 'hsl(50, 100%, 60%)' }}
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
                  <SheetTitle>Manage your conversations</SheetTitle>
                  <SheetDescription>Select your conversation</SheetDescription>
                </SheetHeader>
              </VisuallyHidden>

              <Tabs defaultValue="conversations" className="w-full">
                <TabsList className="my-4 flex justify-around">
                  <TabsTrigger value="conversations">Conversations</TabsTrigger>
                </TabsList>
                <TabsContent value="conversations">
                  <ConversationList
                    conversations={form.watch('conversations') || []}
                    handleDeleteConversation={handleDeleteConversation}
                    handleSetActiveConversation={handleSetActiveConversation}
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
