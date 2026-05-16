'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/types';
import { Sparkles } from 'lucide-react';

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Build me a simple todo app with add and delete functionality.',
    timestamp: Date.now() - 60000,
  },
  {
    id: '2',
    role: 'assistant',
    content:
      'Here\'s a todo app with add and delete functionality:\n\n```html\n<!DOCTYPE html>\n<html>\n<head><title>Todo App</title></head>\n<body>\n  <h1>My Todos</h1>\n  <input id="input" placeholder="Add todo...">\n  <button onclick="addTodo()">Add</button>\n  <ul id="list"></ul>\n  <script>\n    function addTodo() {\n      const input = document.getElementById("input");\n      if (!input.value) return;\n      const li = document.createElement("li");\n      li.textContent = input.value;\n      document.getElementById("list").appendChild(li);\n      input.value = "";\n    }\n  </script>\n</body>\n</html>\n```\n\nThis creates a minimal todo app. You can type a task and click "Add" to append it to the list.',
    timestamp: Date.now() - 30000,
  },
  {
    id: '3',
    role: 'user',
    content: 'Add a delete button next to each item.',
    timestamp: Date.now() - 10000,
  },
];

interface ChatPanelProps {
  messages?: ChatMessage[];
  isGenerating?: boolean;
  onSend?: (message: string) => void;
  onStop?: () => void;
}

export function ChatPanel({
  messages = MOCK_MESSAGES,
  isGenerating = false,
  onSend,
  onStop,
}: ChatPanelProps) {
  const handleSend = (content: string) => {
    onSend?.(content);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Tempo AI</h1>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 py-20 text-center text-muted-foreground">
              <p>Describe the app you want to build.</p>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={onStop}
        isGenerating={isGenerating}
      />
    </div>
  );
}
