"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  id: number;
  assistant_id: string;
  user_id: string;
  direction: "inbound" | "outbound";
  message_text: string;
  token_count: number;
  model_used: string | null;
  timestamp: string;
}

export default function ChatDetailPage() {
  const params = useParams();
  const assistantId = params.assistantId as string;
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { data: initialMessages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", assistantId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/${encodeURIComponent(assistantId)}`);
      const data = await res.json();
      if (data.length > 0) {
        lastMessageRef.current = data[data.length - 1].timestamp;
      }
      return data;
    },
  });

  const messages = React.useMemo(
    () => [...initialMessages, ...liveMessages],
    [initialMessages, liveMessages]
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/sse/chat?assistantId=${encodeURIComponent(assistantId)}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.timestamp > lastMessageRef.current) {
        setLiveMessages((prev) => [...prev, {
          id: Date.now(),
          assistant_id: assistantId,
          user_id: data.userId,
          direction: data.direction as "inbound" | "outbound",
          message_text: data.message,
          token_count: 0,
          model_used: null,
          timestamp: data.timestamp
        }]);
        lastMessageRef.current = data.timestamp;
      }
    };

    return () => {
      eventSource.close();
    };
  }, [assistantId]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--night)]">
        <div className="flex items-center gap-3 text-[var(--lavender-muted)]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--tropical-indigo)] border-t-transparent" />
          Loading conversation...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--night)]">
      <header className="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--night-light)] p-4">
        <Link href="/chat">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ultra-violet)]">
            <Bot className="h-5 w-5 text-[var(--lavender)]" />
          </div>
          <div>
            <h1 className="font-semibold text-[var(--lavender)]">{assistantId}</h1>
            <p className="text-xs text-[var(--dim-gray)]">{messages.length} messages</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-[var(--lavender-muted)]">
            <Send className="mb-4 h-12 w-12 text-[var(--dim-gray)]" />
            <p>No messages in this conversation</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((message, index) => {
              const isUser = message.direction === "inbound";
              const showTimestamp = index === 0 || 
                new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000;

              return (
                <div key={message.id}>
                  {showTimestamp && (
                    <div className="my-2 text-center text-xs text-[var(--dim-gray)]">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  )}
                  <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isUser
                          ? "bg-[var(--tropical-indigo)] text-[var(--night)]"
                          : "bg-[var(--night-lighter)] text-[var(--lavender)]"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isUser ? (
                          <User className="mt-1 h-4 w-4 flex-shrink-0" />
                        ) : (
                          <Bot className="mt-1 h-4 w-4 flex-shrink-0" />
                        )}
                        <p className="whitespace-pre-wrap">{message.message_text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
