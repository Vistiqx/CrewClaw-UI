"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { cronToHumanReadable, getNextRun, formatDateTime } from "@/lib/cron";
import { Badge } from "@/components/ui/Badge";

interface ScheduledTask {
  id: number;
  assistant_id: string;
  assistant_name: string;
  task_name: string;
  schedule: string;
  command: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
}

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/scheduler");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggle = async (taskId: number, enabled: boolean) => {
    try {
      const response = await fetch(`/api/scheduler/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      const updatedTask = await response.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, enabled: updatedTask.enabled } : t))
      );
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.assistant_name]) {
      acc[task.assistant_name] = [];
    }
    acc[task.assistant_name].push(task);
    return acc;
  }, {} as Record<string, ScheduledTask[]>);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--night)]">
        <p className="text-[var(--lavender-muted)]">Loading scheduled tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--night)]">
        <p className="text-[var(--error)]">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--night)] p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-[var(--lavender)]">Heartbeats</h1>
        
        {Object.keys(groupedTasks).length === 0 ? (
          <Card className="bg-[var(--night-light)]">
            <CardContent className="py-12">
              <p className="text-center text-[var(--lavender-muted)]">
                No scheduled tasks found. Tasks will appear here when assistants are configured with Heartbeats.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedTasks).map(([assistantName, assistantTasks]) => (
            <Card key={assistantName} className="mb-6 bg-[var(--night-light)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{assistantName}</span>
                  <Badge variant="secondary">
                    {assistantTasks.length} task{assistantTasks.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Last Run</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assistantTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.task_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[var(--lavender)]">
                              {cronToHumanReadable(task.schedule)}
                            </span>
                            <span className="text-xs text-[var(--dim-gray)]">
                              {task.schedule}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={task.enabled}
                              onCheckedChange={(checked) => handleToggle(task.id, checked)}
                            />
                            <span
                              className={
                                task.enabled
                                  ? "text-[var(--success)]"
                                  : "text-[var(--dim-gray)]"
                              }
                            >
                              {task.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.enabled
                            ? getNextRun(task.schedule)?.toLocaleString() || "—"
                            : "—"}
                        </TableCell>
                        <TableCell>{task.last_run ? formatDateTime(new Date(task.last_run)) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
