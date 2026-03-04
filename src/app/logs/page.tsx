'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: number;
  timestamp: string;
  business: string | null;
  assistant: string | null;
  event_type: string;
  severity: string;
  message: string;
  metadata: string | null;
  stack_trace: string | null;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  eventTypes: string[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSeverityVariant(severity: string) {
  switch (severity) {
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');
  
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filters = useMemo(() => ({
    page,
    startDate,
    endDate,
    eventType,
    severity,
    search,
  }), [page, startDate, endDate, eventType, severity, search]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', filters.page.toString());
    params.set('limit', '50');
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.search) params.set('search', filters.search);

    fetch(`/api/audit-logs?${params.toString()}`)
      .then(res => res.json())
      .then((data: AuditLogsResponse) => {
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setEventTypes(data.eventTypes);
      });
  }, [filters]);

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const handleRowClick = async (log: AuditLog) => {
    const response = await fetch(`/api/audit-logs/${log.id}`);
    const data = await response.json();
    setSelectedLog(data);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const headers = ['timestamp', 'business', 'assistant', 'event_type', 'severity', 'message'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => 
        headers.map(header => {
          const value = log[header as keyof AuditLog];
          if (value === null) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[var(--night)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[var(--lavender)]">Audit Logs</h1>
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--lavender-muted)]">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(setStartDate)(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--lavender-muted)]">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(setEndDate)(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--lavender-muted)]">Event Type</label>
            <Select value={eventType} onValueChange={handleFilterChange(setEventType)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Events</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--lavender-muted)]">Severity</label>
            <Select value={severity} onValueChange={handleFilterChange(setSeverity)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--lavender-muted)]">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--dim-gray)]" />
              <Input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--night-light)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Timestamp</TableHead>
                <TableHead className="w-32">Business</TableHead>
                <TableHead className="w-28">Assistant</TableHead>
                <TableHead className="w-40">Event Type</TableHead>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[var(--lavender-muted)]">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-[var(--night-lighter)]/50 transition-colors duration-[var(--transition-fast)]"
                    onClick={() => handleRowClick(log)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>{log.business || '-'}</TableCell>
                    <TableCell>{log.assistant || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{log.event_type}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityVariant(log.severity)}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{log.message}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--lavender-muted)]">
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[var(--lavender)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                ID: {selectedLog?.id} • {selectedLog && formatDate(selectedLog.timestamp)}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-[var(--lavender-muted)]">Business</span>
                    <p className="text-sm text-[var(--lavender)]">{selectedLog.business || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--lavender-muted)]">Assistant</span>
                    <p className="text-sm text-[var(--lavender)]">{selectedLog.assistant || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--lavender-muted)]">Event Type</span>
                    <p className="text-sm text-[var(--lavender)]">{selectedLog.event_type}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--lavender-muted)]">Severity</span>
                    <div className="mt-1">
                      <Badge variant={getSeverityVariant(selectedLog.severity)}>
                        {selectedLog.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-[var(--lavender-muted)]">Message</span>
                  <p className="text-sm text-[var(--lavender)] mt-1 whitespace-pre-wrap">
                    {selectedLog.message}
                  </p>
                </div>
                {selectedLog.metadata && (
                  <div>
                    <span className="text-xs text-[var(--lavender-muted)]">Metadata</span>
                    <pre className="mt-1 p-3 rounded-[var(--radius-md)] bg-[var(--night)] text-xs text-[var(--lavender)] overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.stack_trace && (
                  <div>
                    <span className="text-xs text-[var(--error)]">Stack Trace</span>
                    <pre className="mt-1 p-3 rounded-[var(--radius-md)] bg-[var(--night)] text-xs text-[var(--error)] overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.stack_trace}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
