'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssistantStream } from 'openai/lib/AssistantStream';
import Markdown from 'react-markdown';
import { AssistantStreamEvent } from 'openai/resources/beta/assistants';
import { RequiredActionFunctionToolCall } from 'openai/resources/beta/threads/runs/runs';
import {
  ToolCall,
  ToolCallDelta
} from 'openai/resources/beta/threads/runs/steps.mjs';
import { TextDelta } from 'openai/resources/beta/threads/messages.mjs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '@/components/ui/spinner';
type MessageProps = {
  role: 'user' | 'assistant' | 'code';
  text: string;
};

const UserMessage = ({ text }: { text: string }) => {
  return (
    <div className="rounded-lg bg-primary p-3 text-primary-foreground">
      {text}
    </div>
  );
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className="rounded-lg bg-card p-3 text-card-foreground">
      <Markdown>{text}</Markdown>
    </div>
  );
};

const CodeMessage = ({ text }: { text: string }) => {
  return (
    <div className="rounded-lg bg-muted p-3 font-mono text-sm text-muted-foreground">
      {text.split('\n').map((line, index) => (
        <div key={index} className="flex">
          <span className="mr-2 text-muted-foreground">{`${index + 1}. `}</span>
          <span>{line}</span>
        </div>
      ))}
    </div>
  );
};

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

type ChatProps = {
  functionCallHandler?: (
    toolCall: RequiredActionFunctionToolCall
  ) => Promise<string>;
};

const Chat = ({
  functionCallHandler = () => Promise.resolve('') // default to return empty string
}: ChatProps) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    []
  );
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // automatically scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // create a new threadID when chat component created
  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`/api/assistants/threads`, {
        method: 'POST'
      });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  const sendMessage = async (text: string) => {
    setIsThinking(true); // Assistant starts thinking
    const response = await fetch(
      `/api/assistants/threads/${threadId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          content: text
        })
      }
    );
    const stream = AssistantStream.fromReadableStream(
      response.body as ReadableStream
    );
    handleReadableStream(stream);
  };

  const submitActionResult = async (
    runId: string,
    toolCallOutputs: { output: string; tool_call_id: string }[]
  ) => {
    const response = await fetch(
      `/api/assistants/threads/${threadId}/actions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          runId: runId,
          toolCallOutputs: toolCallOutputs
        })
      }
    );
    const stream = AssistantStream.fromReadableStream(
      response.body as ReadableStream
    );
    handleReadableStream(stream);
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', text: userInput }
    ]);
    setUserInput('');
    setInputDisabled(true);
    scrollToBottom();
  };

  /* Stream Event Handlers */

  // textCreated - create new assistant message
  const handleTextCreated = () => {
    setIsThinking(false); // Assistant starts responding
    appendMessage('assistant', '');
  };

  // textDelta - append text to last assistant message
  const handleTextDelta = (delta: TextDelta) => {
    if (delta.value != null) {
      appendToLastMessage(delta.value);
    }
    if (delta.annotations != null) {
      annotateLastMessage(delta.annotations);
    }
  };

  // imageFileDone - show image in chat
  const handleImageFileDone = (image: { file_id: any }) => {
    appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
  };

  // toolCallCreated - log new tool call
  const toolCallCreated = (toolCall: { type: string }) => {
    if (toolCall.type != 'code_interpreter') return;
    appendMessage('code', '');
  };

  // toolCallDelta - log delta and snapshot for the tool call
  const toolCallDelta = (delta: ToolCallDelta, snapshot: ToolCall) => {
    if (delta.type != 'code_interpreter') return;
    if (!delta.code_interpreter?.input) return;
    appendToLastMessage(delta.code_interpreter.input);
  };

  // handleRequiresAction - handle function call
  const handleRequiresAction = async (
    event: AssistantStreamEvent.ThreadRunRequiresAction
  ) => {
    const runId = event.data.id;
    const toolCalls =
      event.data?.required_action?.submit_tool_outputs?.tool_calls || [];
    // loop over tool calls and call function handler
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const result = await functionCallHandler(toolCall);
        return { output: result, tool_call_id: toolCall.id };
      })
    );
    setInputDisabled(true);
    submitActionResult(runId, toolCallOutputs);
  };

  // handleRunCompleted - re-enable the input form
  const handleRunCompleted = () => {
    setInputDisabled(false);
  };

  const handleReadableStream = (stream: AssistantStream) => {
    // messages
    stream.on('textCreated', handleTextCreated);
    stream.on('textDelta', handleTextDelta);

    // image
    stream.on('imageFileDone', handleImageFileDone);

    // code interpreter
    stream.on('toolCallCreated', toolCallCreated);
    stream.on('toolCallDelta', toolCallDelta);

    // events without helpers yet (e.g. requires_action and run.done)
    stream.on('event', (event) => {
      if (event.event === 'thread.run.requires_action')
        handleRequiresAction(event);
      if (event.event === 'thread.run.completed') handleRunCompleted();
    });
  };

  /*
    =======================
    === Utility Helpers ===
    =======================
  */

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

  const appendMessage = (role: string, text: string) => {
    setMessages((prevMessages) => [...prevMessages, { role, text }]);
  };

  const annotateLastMessage = (annotations: any[]) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage
      };
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

  return (
    <div
      className="flex flex-col rounded-lg border bg-white p-4 shadow dark:bg-gray-900"
      style={{ height: 'calc(100vh - 100px)' }} // Adjust height dynamically
    >
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto px-4">
        {messages.map((msg, index) => (
          <Message
            key={index}
            role={msg.role as 'user' | 'assistant' | 'code'}
            text={msg.text}
          />
        ))}
        {isThinking && <Spinner />}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center space-x-4 border-t pt-4"
      >
        <Input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask anything!"
        />

        <Button disabled={inputDisabled}>Send</Button>
      </form>
    </div>
  );
};

export default Chat;
