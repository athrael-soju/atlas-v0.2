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
import { AssistantFileUploader } from './analysis-list';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';

const defaultValues = {
  conversations: []
};

type ChatSidebarProps = {
  knowledgebaseEnabled: boolean;
  setMessages: React.Dispatch<React.SetStateAction<any>>;
};

export const ChatSidebar = forwardRef<unknown, ChatSidebarProps>(
  (props, ref) => {
    const { data: session } = useSession();
    const userId = session?.user.id as string;
    const { knowledgebaseEnabled, setMessages } = props;
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
        createdAt: new Date().toISOString(),
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

    // Mock delete file handler
    const handleDeleteFile = (file: any) => {
      // Implement the file delete logic here
      toast({
        title: 'File deleted',
        description: `File ${file.fileName} has been deleted.`
      });
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
                  color: 'hsl(210, 10%, 40%)' // example static hsl color value
                }}
                whileHover={{
                  color: 'hsl(50, 100%, 60%)' // hover to a specific hsl color value
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
                  <TabsTrigger value="files" disabled={knowledgebaseEnabled}>
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
                  <AssistantFileUploader userId={userId} />
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </form>
      </Form>
    );
  }
);
