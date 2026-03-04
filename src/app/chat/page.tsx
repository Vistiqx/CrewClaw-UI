"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { MessageCircle, Clock, User } from "lucide-react";

interface ChatSession {
  assistantId: string;
  assistantName: string;
  userId: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

export default function ChatPage() {
  const { data: sessions = [], isLoading } = useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/chat");
      return res.json();
    },
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--night)]">
        <div className="flex items-center gap-3 text-[var(--lavender-muted)]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--tropical-indigo)] border-t-transparent" />
          Loading chat sessions...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--night)] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-[var(--tropical-indigo)]" />
          <h1 className="text-2xl font-bold text-[var(--lavender)]">Chat History</h1>
        </div>

        {sessions.length === 0 ? (
          <Card className="border-[var(--border)] bg-[var(--night-light)]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageCircle className="mb-4 h-12 w-12 text-[var(--dim-gray)]" />
              <p className="text-[var(--lavender-muted)]">No chat sessions yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Link key={`${session.assistantId}-${session.userId}`} href={`/chat/${encodeURIComponent(session.assistantId)}`}>
                <Card className="cursor-pointer border-[var(--border)] bg-[var(--night-light)] transition-all duration-[var(--transition-base)] hover:border-[var(--tropical-indigo)] hover:bg-[var(--night-lighter)]">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--ultra-violet)]">
                      <MessageCircle className="h-6 w-6 text-[var(--lavender)]" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[var(--lavender)] truncate">
                          {session.assistantName}
                        </h3>
                      </div>
                      
                      <div className="mt-1 flex items-center gap-2 text-sm text-[var(--lavender-muted)]">
                        <User className="h-3 w-3" />
                        <span className="truncate">{session.userId}</span>
                      </div>
                      
                      <p className="mt-1 truncate text-sm text-[var(--dim-gray)]">
                        {session.lastMessage}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 text-xs text-[var(--dim-gray)]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(session.timestamp)}
                      </div>
                      <span className="rounded-full bg-[var(--ultra-violet)] px-2 py-0.5 text-[var(--lavender)]">
                        {session.messageCount} messages
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
