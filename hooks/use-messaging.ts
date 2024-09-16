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
import { useUserForm } from './use-fetch-and-submit'; // Assuming this is where your hook is stored.
import { chatFormSchema, ChatFormValues } from '@/lib/form-schema';

type Message = {
  role: 'user' | 'assistant' | 'code';
  text: string;
};

const defaultValues: Partial<ChatFormValues> = {
  activeConversationId: ''
};

export const useMessaging = (
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

  const { form } = useUserForm({
    schema: chatFormSchema,
    defaultValues,
    formPath: 'settings.chat'
  });

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
  };

  const sendMessage = async (text: string, knowledgebaseEnabled: boolean) => {
    setIsThinking(true);
    setInputDisabled(true);
    const userId = session?.user.id as string;
    appendMessage('user', text);
    if (knowledgebaseEnabled) {
      const contextEnrichedMessage = await fetchContextEnrichedMessage(
        userId,
        text
      );
      if (contextEnrichedMessage) {
        text = contextEnrichedMessage;
      }
    }
    const response = await fetch(
      `/api/assistants/threads/${form.getValues(
        'activeConversationId'
      )}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ text: text })
      }
    );
    const stream = AssistantStream.fromReadableStream(
      response.body as ReadableStream
    );
    handleReadableStream(stream);
    scrollToBottom();
  };

  const submitActionResult = async (
    runId: string,
    toolCallOutputs: { output: string; tool_call_id: string }[]
  ) => {
    const response = await fetch(
      `/api/assistants/threads/${form.getValues(
        'activeConversationId'
      )}/actions`,
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
    isThinking,
    isStreaming,
    inputDisabled,
    userInputRef: messagesEndRef,
    sendMessage,
    abortStream
  };
};
