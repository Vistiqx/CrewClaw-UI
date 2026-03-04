"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, Pencil, Trash2, Play, Pause, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { cronToHumanReadable } from "@/lib/cron";

interface CronJob {
  id: number;
  name: string;
  description: string | null;
  cron_expression: string;
  command: string;
  enabled: boolean;
  assistant_id: number | null;
  assistant_name: string | null;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
}

interface Assistant {
  id: number;
  name: string;
}

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cron_expression: "",
    command: "",
    assistant_id: "",
  });

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/cron-jobs");
      const data = await response.json();
      setJobs(data.jobs || []);
      setAssistants(data.assistants || []);
    } catch (error) {
      console.error("Failed to fetch cron jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", description: "", cron_expression: "", command: "", assistant_id: "" });
    setFormError(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (job: CronJob) => {
    setSelectedJob(job);
    setFormData({
      name: job.name,
      description: job.description || "",
      cron_expression: job.cron_expression,
      command: job.command,
      assistant_id: job.assistant_id ? String(job.assistant_id) : "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (job: CronJob) => {
    setSelectedJob(job);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/cron-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          cron_expression: formData.cron_expression,
          command: formData.command,
          assistant_id: formData.assistant_id ? parseInt(formData.assistant_id) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add cron job");
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchJobs();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    
    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/cron-jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJob.id,
          name: formData.name,
          description: formData.description || null,
          cron_expression: formData.cron_expression,
          command: formData.command,
          assistant_id: formData.assistant_id ? parseInt(formData.assistant_id) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update cron job");
      }

      setIsEditDialogOpen(false);
      setSelectedJob(null);
      resetForm();
      fetchJobs();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (job: CronJob) => {
    try {
      await fetch("/api/cron-jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, enabled: !job.enabled }),
      });
      fetchJobs();
    } catch (error) {
      console.error("Failed to toggle cron job:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedJob) return;
    
    setSubmitting(true);
    try {
      await fetch("/api/cron-jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedJob.id }),
      });
      setIsDeleteDialogOpen(false);
      setSelectedJob(null);
      fetchJobs();
    } catch (error) {
      console.error("Failed to delete cron job:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--night)]">
        <p className="text-[var(--lavender-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-[var(--tropical-indigo)]" />
          <h1 className="text-3xl font-bold text-[var(--lavender)]">CRON Jobs</h1>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add CRON Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card className="bg-night-light border-border">
          <CardContent className="py-12">
            <p className="text-center text-[var(--lavender-muted)]">
              No CRON jobs found. Create one to schedule automated tasks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="bg-night-light border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--lavender)]">{job.name}</h3>
                      <Badge variant={job.enabled ? "success" : "secondary"}>
                        {job.enabled ? "Active" : "Disabled"}
                      </Badge>
                      {job.assistant_name && (
                        <Badge variant="info">{job.assistant_name}</Badge>
                      )}
                    </div>
                    {job.description && (
                      <p className="text-sm text-[var(--lavender-muted)] mb-3">{job.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-[var(--dim-gray)]">Schedule: </span>
                        <span className="text-[var(--lavender)] font-mono">{cronToHumanReadable(job.cron_expression)}</span>
                        <span className="text-[var(--dim-gray)] ml-2">({job.cron_expression})</span>
                      </div>
                      <div>
                        <span className="text-[var(--dim-gray)]">Command: </span>
                        <code className="text-[var(--lavender)] font-mono text-xs bg-night-darker px-2 py-1 rounded">
                          {job.command}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={job.enabled} onCheckedChange={() => handleToggle(job)} />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(job)}>
                      <Pencil className="h-4 w-4 text-[var(--tropical-indigo)]" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(job)}>
                      <Trash2 className="h-4 w-4 text-[var(--error)]" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add CRON Job</DialogTitle>
            <DialogDescription>Create a new scheduled CRON job.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {formError && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--error)]/10 p-3 text-sm text-[var(--error)]">
                  {formError}
                </div>
              )}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Name</label>
                <Input
                  placeholder="e.g., Daily Backup"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Description</label>
                <Input
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">CRON Expression</label>
                <Input
                  placeholder="e.g., 0 0 * * *"
                  value={formData.cron_expression}
                  onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
                  required
                />
                <span className="text-xs text-[var(--dim-gray)]">
                  Format: minute hour day month weekday
                </span>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Command</label>
                <Input
                  placeholder="e.g., /opt/scripts/backup.sh"
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Assistant (optional)</label>
                <Select value={formData.assistant_id} onValueChange={(v) => setFormData({ ...formData, assistant_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {assistants.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                Add Job
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit CRON Job</DialogTitle>
            <DialogDescription>Update the CRON job &quot;{selectedJob?.name}&quot;</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              {formError && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--error)]/10 p-3 text-sm text-[var(--error)]">
                  {formError}
                </div>
              )}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">CRON Expression</label>
                <Input
                  value={formData.cron_expression}
                  onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Command</label>
                <Input
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Assistant</label>
                <Select value={formData.assistant_id} onValueChange={(v) => setFormData({ ...formData, assistant_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {assistants.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                Update Job
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete CRON Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedJob?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDelete} disabled={submitting} className="bg-[var(--error)] hover:bg-[var(--error)]/90">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
