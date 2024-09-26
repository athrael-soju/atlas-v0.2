import { useState, useEffect, useRef } from 'react';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { TextDelta } from 'openai/resources/beta/threads/messages.mjs';
import {
  ToolCall,
  ToolCallDelta
} from 'openai/resources/beta/threads/runs/steps.mjs';
import { AssistantStreamEvent } from 'openai/resources/beta/assistants';
import { fetchContextEnrichedMessage } from '@/lib/service/atlas';
import { useSession } from 'next-auth/react';
import { useFetchAndSubmit } from './use-fetch-and-submit';
import {
  conversationsFormSchema,
  ConversationsFormValues
} from '@/lib/form-schema';
import { toast } from '@/components/ui/use-toast';
import { AssistantMode, ProfileSettings } from '@/types/settings';
import { addPersonalizedInfo } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant' | 'code';
  text: string;
};

const defaultValues: Partial<ConversationsFormValues> = {
  activeConversationId: ''
};

export const useMessaging = (
  profileSettings: ProfileSettings,
  functionCallHandler: (toolCall: any) => Promise<string> = () =>
    Promise.resolve('')
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const { data: session } = useSession();

  const abortStream = () => {
    // TODO: Implement this
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { form } = useFetchAndSubmit({
    schema: conversationsFormSchema,
    defaultValues,
    formPath: 'data'
  });

  const conversationId = form.getValues('activeConversationId');
  const appendToLastMessage = (text: string) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        text: lastMessage.text + text
      };
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const appendMessage = (role: 'user' | 'assistant' | 'code', text: string) => {
    setMessages((prevMessages) => [...prevMessages, { role, text }]);
  };

  const annotateLastMessage = (annotations: any[]) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = { ...lastMessage };
      annotations.forEach((annotation) => {
        if (annotation.type === 'file_path') {
          updatedLastMessage.text = updatedLastMessage.text.replaceAll(
            annotation.text,
            `/api/files/${annotation.file_path.file_id}`
          );
        }
      });
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const handleTextCreated = () => {
    setIsThinking(false);
    appendMessage('assistant', '');
  };

  const handleTextDelta = (delta: TextDelta) => {
    if (delta.value != null) appendToLastMessage(delta.value);
    if (delta.annotations != null) annotateLastMessage(delta.annotations);
  };

  const handleImageFileDone = (image: { file_id: any }) => {
    appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
  };

  const toolCallCreated = (toolCall: { type: string }) => {
    if (toolCall.type !== 'code_interpreter') return;
    appendMessage('code', '');
  };

  const toolCallDelta = (delta: ToolCallDelta, snapshot: ToolCall) => {
    if (delta.type !== 'code_interpreter') return;
    if (!delta.code_interpreter?.input) return;
    appendToLastMessage(delta.code_interpreter.input);
  };

  const handleRequiresAction = async (
    event: AssistantStreamEvent.ThreadRunRequiresAction
  ) => {
    const runId = event.data.id;
    const toolCalls =
      event.data?.required_action?.submit_tool_outputs?.tool_calls || [];
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const result = await functionCallHandler(toolCall);
        return { output: result, tool_call_id: toolCall.id };
      })
    );
    setInputDisabled(true);
    submitActionResult(runId, toolCallOutputs);
  };

  const handleRunCompleted = () => {
    setInputDisabled(false);
  };

  const handleReadableStream = (stream: AssistantStream) => {
    stream.on('textCreated', handleTextCreated);
    stream.on('textDelta', handleTextDelta);
    stream.on('imageFileDone', handleImageFileDone);
    stream.on('toolCallCreated', toolCallCreated);
    stream.on('toolCallDelta', toolCallDelta);
    stream.on('event', (event) => {
      setIsStreaming(true);
      if (event.event === 'thread.run.requires_action')
        handleRequiresAction(event);
      if (event.event === 'thread.run.completed') handleRunCompleted();
    });
    stream.on('end', () => {
      setIsStreaming(false);
      setInputDisabled(false);
    });
    stream.on('error', (error) => {
      setIsThinking(false);
      setInputDisabled(false);
      toast({
        title: 'Whoops!',
        description: `Something went wrong while sending your message. '${error}'. Please try again, or contact support if the issue persists.`,
        variant: 'destructive'
      });
    });
  };

  const sendMessage = async (text: string, assistantMode: AssistantMode) => {
    try {
      setIsThinking(true);
      setInputDisabled(true);
      const userId = session?.user.id as string;
      const userMessage = text;
      appendMessage('user', userMessage);

      // Step 1: Fetch context-enriched message if knowledgebase mode is enabled
      let contextMessage = text;
      if (assistantMode === AssistantMode.Knowledgebase) {
        const contextEnrichedMessage = await fetchContextEnrichedMessage(
          userId,
          text
        );
        if (contextEnrichedMessage) {
          contextMessage = contextEnrichedMessage; // Replace the original text with the context-enriched message
        }
      }

      // Step 2: Add personalized info if enabled
      let finalMessage = contextMessage;
      if (profileSettings.personalizedResponses) {
        const personalizedInfo = addPersonalizedInfo(profileSettings);
        finalMessage = `${personalizedInfo}\n==============\n${contextMessage}`; // Append personalized info before context
      }

      // Step 3: Append user message at the end
      finalMessage += `
==============
User message: ${userMessage}
==============`;

      // Step 4: Send the message after context and personalization are added
      const response = await fetch(
        `/api/assistants/threads/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ text: finalMessage })
        }
      );

      // Handle the response stream
      const stream = AssistantStream.fromReadableStream(
        response.body as ReadableStream
      );
      handleReadableStream(stream);

      // Scroll to bottom after message is handled
      scrollToBottom();
    } catch (error) {
      toast({
        title: 'Whoops!',
        description: `Something went wrong while sending your message. '${error}'. Please try again, or contact support if the issue persists.`,
        variant: 'destructive'
      });
      // Handle error cases, maybe display an error message to the user
    } finally {
      // Re-enable the input and stop thinking indicator
      setIsThinking(false);
      setInputDisabled(false);
    }
  };

  const submitActionResult = async (
    runId: string,
    toolCallOutputs: { output: string; tool_call_id: string }[]
  ) => {
    const response = await fetch(
      `/api/assistants/threads/${conversationId}/actions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, toolCallOutputs })
      }
    );
    const stream = AssistantStream.fromReadableStream(
      response.body as ReadableStream
    );
    handleReadableStream(stream);
  };

  return {
    messages,
    setMessages,
    isThinking,
    isStreaming,
    inputDisabled,
    userInputRef: messagesEndRef,
    sendMessage,
    abortStream
  };
};
