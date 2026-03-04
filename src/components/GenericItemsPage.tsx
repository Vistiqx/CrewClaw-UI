"use client";

import { useEffect, useState } from "react";
import { Wrench, Plus, Trash2, X, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

interface Item {
  id: number;
  name: string;
  description: string | null;
  type: string;
  content: string | null;
  file_path: string | null;
  enabled: boolean;
  assistant_id: number | null;
  assistant_name: string | null;
  created_at: string;
}

interface Assistant {
  id: number;
  name: string;
}

interface GenericPageProps {
  title: string;
  icon: React.ReactNode;
  apiEndpoint: string;
  typeOptions: { value: string; label: string }[];
}

export function GenericItemsPage({ title, icon, apiEndpoint, typeOptions }: GenericPageProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    content: "",
    file_path: "",
    assistant_id: "",
  });

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/${apiEndpoint}`);
      const data = await response.json();
      setItems(data[apiEndpoint] || []);
      setAssistants(data.assistants || []);
    } catch (error) {
      console.error(`Failed to fetch ${apiEndpoint}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", description: "", type: "", content: "", file_path: "", assistant_id: "" });
    setFormError(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openDeleteDialog = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/${apiEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          type: formData.type,
          content: formData.content || null,
          file_path: formData.file_path || null,
          assistant_id: formData.assistant_id ? parseInt(formData.assistant_id) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to add ${title.slice(0, -1)}`);
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    
    setSubmitting(true);
    try {
      await fetch(`/api/${apiEndpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id }),
      });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.error(`Failed to delete ${apiEndpoint}:`, error);
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
          {icon}
          <h1 className="text-3xl font-bold text-[var(--lavender)]">{title}</h1>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add {title.slice(0, -1)}
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="bg-night-light border-border">
          <CardContent className="py-12">
            <p className="text-center text-[var(--lavender-muted)]">
              No {title.toLowerCase()} found. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="bg-night-light border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--lavender)]">{item.name}</h3>
                      <Badge variant={item.enabled ? "success" : "secondary"}>
                        {item.enabled ? "Active" : "Disabled"}
                      </Badge>
                      <Badge variant="info">{item.type}</Badge>
                      {item.assistant_name && (
                        <Badge variant="warning">{item.assistant_name}</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-[var(--lavender-muted)] mb-2">{item.description}</p>
                    )}
                    {item.file_path && (
                      <div className="flex items-center gap-2 text-sm text-[var(--dim-gray)]">
                        <FolderOpen className="h-3 w-3" />
                        <code className="font-mono text-xs">{item.file_path}</code>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item)}>
                    <Trash2 className="h-4 w-4 text-[var(--error)]" />
                  </Button>
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
            <DialogTitle>Add {title.slice(0, -1)}</DialogTitle>
            <DialogDescription>Create a new {title.slice(0, -1).toLowerCase()}.</DialogDescription>
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
                  placeholder="e.g., Web Search"
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
                <label className="text-sm font-medium text-[var(--lavender)]">Type</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">File Path</label>
                <Input
                  placeholder="e.g., /opt/data/skills/web_search.py"
                  value={formData.file_path}
                  onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--lavender)]">Assistant (optional)</label>
                <Select value={formData.assistant_id || "null"} onValueChange={(v) => setFormData({ ...formData, assistant_id: v === "null" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
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
                Add {title.slice(0, -1)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {title.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedItem?.name}&quot;? This action cannot be undone.
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
