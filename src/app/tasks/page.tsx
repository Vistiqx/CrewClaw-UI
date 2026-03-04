"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, MoreVertical, GripVertical, Calendar, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface Business {
  id: string;
  name: string;
  prefix: string;
}

interface Assistant {
  id: number;
  name: string;
  business_id: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  business_id: string | null;
  business_name: string | null;
  assistant_id: number | null;
  assistant_name: string | null;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
}

type TaskStatus = Task["status"];
type TaskPriority = Task["priority"];

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "var(--lavender-muted)" },
  { id: "in_progress", title: "In Progress", color: "var(--tropical-indigo)" },
  { id: "review", title: "Review", color: "var(--sunset-orange)" },
  { id: "done", title: "Done", color: "var(--minted-green)" },
];

const PRIORITY_COLORS: Record<TaskPriority, "default" | "secondary" | "success" | "warning" | "error" | "info" | "outline"> = {
  low: "secondary",
  medium: "default",
  high: "warning",
  urgent: "error",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    business_id: "",
    assistant_id: "",
    assignee: "",
    due_date: "",
  });

  const [editTask, setEditTask] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    business_id: "",
    assistant_id: "",
    assignee: "",
    due_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, bizRes, assistantsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/businesses"),
        fetch("/api/assistants"),
      ]);
      const tasksData = await tasksRes.json();
      const bizData = await bizRes.json();
      const assistantsData = await assistantsRes.json();
      setTasks(tasksData);
      setBusinesses(bizData);
      setAssistants(assistantsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleCreateTask = async () => {
    if (!newTask.title) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || undefined,
          priority: newTask.priority,
          business_id: newTask.business_id || undefined,
          assistant_id: newTask.assistant_id ? parseInt(newTask.assistant_id) : undefined,
          assignee: newTask.assignee || undefined,
          due_date: newTask.due_date || undefined,
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          business_id: "",
          assistant_id: "",
          assignee: "",
          due_date: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      business_id: task.business_id || "",
      assistant_id: task.assistant_id ? String(task.assistant_id) : "",
      assignee: task.assignee || "",
      due_date: task.due_date || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTask.title) return;

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTask.title,
          description: editTask.description || undefined,
          priority: editTask.priority,
          business_id: editTask.business_id || undefined,
          assistant_id: editTask.assistant_id ? parseInt(editTask.assistant_id) : undefined,
          assignee: editTask.assignee || undefined,
          due_date: editTask.due_date || undefined,
        }),
      });

      if (res.ok) {
        setIsEditOpen(false);
        setEditingTask(null);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask && draggedTask.status !== status) {
      handleStatusChange(draggedTask.id, status);
    }
    setDraggedTask(null);
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(task)}
      onDragOver={handleDragOver}
      onDrop={() => {}}
      className="bg-night-lighter border border-border rounded-lg p-3 cursor-grab hover:border-[var(--lavender-muted)] transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-[var(--lavender)]">{task.title}</h4>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
            onClick={() => openEditDialog(task)}
          >
            <span className="text-xs text-[var(--tropical-indigo)]">Edit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
            onClick={() => handleDeleteTask(task.id)}
          >
            <AlertCircle className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-[var(--lavender-muted)] mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant={PRIORITY_COLORS[task.priority]} className="text-xs">
          {task.priority}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--lavender-muted)]">
        {task.business_name && (
          <span className="truncate">{task.business_name}</span>
        )}
        {task.due_date && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.assignee && (
        <div className="flex items-center gap-1 mt-2 text-xs text-[var(--lavender-muted)]">
          <User className="h-3 w-3" />
          {task.assignee}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--lavender)]">Tasks</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-[var(--lavender-muted)]">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="bg-night-dark rounded-lg p-3 min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ color: column.color }}>
                  {column.title}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {getTasksByStatus(column.id).length}
                </Badge>
              </div>

              <div className="space-y-2">
                {getTasksByStatus(column.id).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new task to the board</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Title</label>
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Description</label>
              <Input
                placeholder="Optional description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Priority</label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v) => setNewTask({ ...newTask, priority: v as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Business</label>
                <Select
                  value={newTask.business_id}
                  onValueChange={(v) => setNewTask({ ...newTask, business_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((biz) => (
                      <SelectItem key={biz.id} value={biz.id}>
                        {biz.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Assistant</label>
                <Select
                  value={newTask.assistant_id}
                  onValueChange={(v) => setNewTask({ ...newTask, assistant_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((asst) => (
                      <SelectItem key={asst.id} value={String(asst.id)}>
                        {asst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Assign To</label>
                <Select
                  value={newTask.assignee}
                  onValueChange={(v) => setNewTask({ ...newTask, assignee: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((asst) => (
                      <SelectItem key={asst.id} value={String(asst.id)}>
                        {asst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Due Date</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTask.title}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Title</label>
              <Input
                placeholder="Task title"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Description / Notes</label>
              <Input
                placeholder="Description or notes"
                value={editTask.description}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Priority</label>
                <Select
                  value={editTask.priority}
                  onValueChange={(v) => setEditTask({ ...editTask, priority: v as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Business</label>
                <Select
                  value={editTask.business_id}
                  onValueChange={(v) => setEditTask({ ...editTask, business_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((biz) => (
                      <SelectItem key={biz.id} value={biz.id}>
                        {biz.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Assistant</label>
                <Select
                  value={editTask.assistant_id}
                  onValueChange={(v) => setEditTask({ ...editTask, assistant_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((asst) => (
                      <SelectItem key={asst.id} value={String(asst.id)}>
                        {asst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Due Date</label>
                <Input
                  type="date"
                  value={editTask.due_date}
                  onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Assign To</label>
              <Select
                value={editTask.assignee}
                onValueChange={(v) => setEditTask({ ...editTask, assignee: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assistant" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map((asst) => (
                    <SelectItem key={asst.id} value={String(asst.id)}>
                      {asst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask} disabled={!editTask.title}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
