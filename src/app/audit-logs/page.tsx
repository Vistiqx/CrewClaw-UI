"use client";

import { useEffect, useState } from "react";
import { Shield, Search, Filter, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface AuditLog {
  id: number;
  timestamp: string;
  business: string | null;
  assistant: string | null;
  event_type: string;
  severity: string;
  message: string;
  metadata: string | null;
  user?: string;
  ip_address?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (severity !== "all") params.set("severity", severity);
      if (eventType !== "all") params.set("eventType", eventType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      
      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      if (data.eventTypes) setEventTypes(data.eventTypes);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [severity]);

  const getSeverityVariant = (sev: string): "success" | "warning" | "error" | "secondary" => {
    switch (sev.toLowerCase()) {
      case "info": return "secondary";
      case "warning": return "warning";
      case "error": return "error";
      default: return "success";
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const parseMetadata = (metadata: string | null): Record<string, unknown> | null => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-[var(--tropical-indigo)]" />
        <h1 className="text-3xl font-bold text-[var(--lavender)]">Audit Logs</h1>
      </div>

      <Card className="bg-night-light border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--lavender-muted)]" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                className="pl-10"
              />
            </div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="px-3 py-2 rounded-md bg-night-lighter text-[var(--lavender)] border border-border"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="px-3 py-2 rounded-md bg-night-lighter text-[var(--lavender)] border border-border"
            >
              <option value="all">All Event Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <Button variant="secondary" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--lavender-muted)]">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--lavender-muted)]">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            {(startDate || endDate) && (
              <Button variant="ghost" onClick={() => { setStartDate(""); setEndDate(""); }} className="text-sm">
                Clear Dates
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-[var(--lavender-muted)]">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-[var(--lavender-muted)]">No audit logs found</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const metadata = parseMetadata(log.metadata);
                const isExpanded = expandedId === log.id;
                
                return (
                  <div
                    key={log.id}
                    className="rounded-lg bg-night-lighter border border-border overflow-hidden"
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-night-border transition-colors"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <button className="mt-1 text-[var(--lavender-muted)] hover:text-[var(--lavender)]">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant={getSeverityVariant(log.severity)}>
                                {log.severity}
                              </Badge>
                              <span className="text-sm font-mono text-[var(--lavender-muted)]">
                                {log.event_type}
                              </span>
                            </div>
                            <p className="text-[var(--lavender)]">{log.message}</p>
                            <div className="flex gap-4 mt-2 text-sm text-[var(--lavender-muted)] flex-wrap">
                              {log.business && <span>Business: <span className="text-[var(--lavender)]">{log.business}</span></span>}
                              {log.assistant && <span>Assistant: <span className="text-[var(--lavender)]">{log.assistant}</span></span>}
                              {log.user && <span>User: <span className="text-[var(--lavender)]">{log.user}</span></span>}
                              {log.ip_address && <span>IP: <span className="text-[var(--lavender)]">{log.ip_address}</span></span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-[var(--lavender-muted)] whitespace-nowrap">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    {isExpanded && (metadata || log.metadata) && (
                      <div className="px-4 pb-4 pt-0 border-t border-border bg-night-darker">
                        <div className="mt-3">
                          <span className="text-sm font-medium text-[var(--lavender-muted)]">Metadata:</span>
                          <pre className="mt-2 p-3 rounded bg-night-lighter text-sm text-[var(--lavender)] overflow-x-auto">
                            {metadata ? JSON.stringify(metadata, null, 2) : log.metadata}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
