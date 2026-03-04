"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Pause, Play, Trash2, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
}

interface LogViewerProps {
  containerId: string | null;
  className?: string;
}

const MAX_LOGS = 1000;

export function LogViewer({ containerId, className }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connectToStream = useCallback(() => {
    if (!containerId || isPaused) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/sse/logs?containerId=${encodeURIComponent(containerId)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (isPaused) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.timestamp && data.message) {
          setLogs((prev) => {
            const newLog: LogEntry = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: data.timestamp,
              level: data.level || "info",
              message: data.message,
            };
            const updated = [...prev, newLog];
            if (updated.length > MAX_LOGS) {
              return updated.slice(-MAX_LOGS);
            }
            return updated;
          });
        }
      } catch {
        // Ignore non-JSON messages (like heartbeat)
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  }, [containerId, isPaused]);

  useEffect(() => {
    connectToStream();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connectToStream]);

  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isPaused]);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== "all" && log.level !== levelFilter) {
      return false;
    }
    if (searchFilter && !log.message.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-[var(--error)]";
      case "warning":
        return "text-[var(--warning)]";
      case "debug":
        return "text-[var(--dim-gray)]";
      default:
        return "text-[var(--lavender)]";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-3 p-3 border-b border-[var(--border)] bg-[var(--night-light)]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePause}
            title={isPaused ? "Resume streaming" : "Pause streaming"}
          >
            {isPaused ? (
              <Play className="h-4 w-4 text-[var(--success)]" />
            ) : (
              <Pause className="h-4 w-4 text-[var(--warning)]" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearLogs}
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--dim-gray)]" />
          <Input
            type="text"
            placeholder="Search logs..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--dim-gray)]" />
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-[var(--dim-gray)]">
          {filteredLogs.length} / {logs.length} lines
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[var(--night)] font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--dim-gray)]">
            {containerId ? "Waiting for logs..." : "Select a container to view logs"}
          </div>
        ) : (
          <div className="p-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex gap-3 py-0.5 hover:bg-[var(--night-light)]"
              >
                <span className="text-[var(--dim-gray)] shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className={cn("shrink-0 uppercase text-xs font-bold w-16", getLevelColor(log.level))}>
                  {log.level}
                </span>
                <span className="text-[var(--lavender)] break-all whitespace-pre-wrap">
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
