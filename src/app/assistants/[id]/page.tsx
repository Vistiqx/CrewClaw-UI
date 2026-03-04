"use client";

import { useEffect, useReducer, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Square, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface Assistant {
  id: number;
  name: string;
  business_id: number;
  business_name: string;
  channel: string;
  status: "running" | "stopped" | "error";
  role: string | null;
  container_id: string | null;
  created_at: string;
  updated_at: string;
}

const statusVariants = {
  running: "success",
  stopped: "secondary",
  error: "error",
} as const;

interface AssistantDetailState {
  assistant: Assistant | null;
  isLoading: boolean;
  isActionLoading: boolean;
  isDeleteOpen: boolean;
  error: string | null;
}

type AssistantDetailAction =
  | { type: "SET_ASSISTANT"; payload: Assistant | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACTION_LOADING"; payload: boolean }
  | { type: "SET_DELETE_OPEN"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

const initialState: AssistantDetailState = {
  assistant: null,
  isLoading: true,
  isActionLoading: false,
  isDeleteOpen: false,
  error: null,
};

function assistantDetailReducer(state: AssistantDetailState, action: AssistantDetailAction): AssistantDetailState {
  switch (action.type) {
    case "SET_ASSISTANT":
      return { ...state, assistant: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ACTION_LOADING":
      return { ...state, isActionLoading: action.payload };
    case "SET_DELETE_OPEN":
      return { ...state, isDeleteOpen: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export default function AssistantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [state, dispatch] = useReducer(assistantDetailReducer, initialState);
  const { assistant, isLoading, isActionLoading, isDeleteOpen, error } = state;

  useEffect(() => {
    fetchAssistant();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAssistant = async () => {
    try {
      const res = await fetch(`/api/assistants/${id}`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_ASSISTANT", payload: data });
      } else {
        dispatch({ type: "SET_ERROR", payload: "Assistant not found" });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch assistant" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleAction = async (action: "start" | "stop" | "restart") => {
    dispatch({ type: "SET_ACTION_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const res = await fetch(`/api/assistants/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        await fetchAssistant();
      } else {
        const data = await res.json();
        dispatch({ type: "SET_ERROR", payload: data.error || `Failed to ${action} assistant` });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: `Failed to ${action} assistant` });
    } finally {
      dispatch({ type: "SET_ACTION_LOADING", payload: false });
    }
  };

  const handleDelete = async () => {
    dispatch({ type: "SET_ACTION_LOADING", payload: true });
    try {
      const res = await fetch(`/api/assistants/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/assistants");
      } else {
        const data = await res.json();
        dispatch({ type: "SET_ERROR", payload: data.error || "Failed to delete assistant" });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Failed to delete assistant" });
    } finally {
      dispatch({ type: "SET_ACTION_LOADING", payload: false });
      dispatch({ type: "SET_DELETE_OPEN", payload: false });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--night)] p-6">
        <div className="max-w-4xl mx-auto text-center py-8 text-[var(--lavender-muted)]">
          Loading...
        </div>
      </div>
    );
  }

  if (error && !assistant) {
    return (
      <div className="min-h-screen bg-[var(--night)] p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/assistants">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assistants
            </Button>
          </Link>
          <Card>
            <CardContent className="py-8 text-center text-[var(--error)]">
              {error}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!assistant) return null;

  return (
    <div className="min-h-screen bg-[var(--night)] p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/assistants">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assistants
          </Button>
        </Link>

        {error && (
          <Card className="mb-6 border-[var(--error)]">
            <CardContent className="py-4 text-[var(--error)]">
              {error}
            </CardContent>
          </Card>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--lavender)]">
              {assistant.name}
            </h1>
            <p className="text-[var(--lavender-muted)] mt-1">
              {assistant.business_name}
            </p>
          </div>
          <Badge variant={statusVariants[assistant.status]} className="text-sm">
            {assistant.status}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[var(--lavender-muted)]">Channel</p>
                <p className="text-[var(--lavender)] capitalize">{assistant.channel}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--lavender-muted)]">Role</p>
                <p className="text-[var(--lavender)]">{assistant.role || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--lavender-muted)]">Created</p>
                <p className="text-[var(--lavender)]">
                  {new Date(assistant.created_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Container</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[var(--lavender-muted)]">Container ID</p>
                <p className="text-[var(--lavender)] font-mono text-sm">
                  {assistant.container_id || "Not deployed"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--lavender-muted)]">Last Updated</p>
                <p className="text-[var(--lavender)]">
                  {new Date(assistant.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {assistant.status !== "running" && (
              <Button
                variant="primary"
                onClick={() => handleAction("start")}
                disabled={isActionLoading}
              >
                <Play className="h-4 w-4 mr-2" />
                {isActionLoading ? "Starting..." : "Start"}
              </Button>
            )}
            {assistant.status === "running" && (
              <Button
                variant="secondary"
                onClick={() => handleAction("stop")}
                disabled={isActionLoading}
              >
                <Square className="h-4 w-4 mr-2" />
                {isActionLoading ? "Stopping..." : "Stop"}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => handleAction("restart")}
              disabled={isActionLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isActionLoading ? "Restarting..." : "Restart"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[var(--error)]/50">
          <CardHeader>
            <CardTitle className="text-[var(--error)]">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--lavender-muted)] mb-4">
              Deleting an assistant will remove it from the database. The Docker container
              will need to be manually cleaned up.
            </p>
            <Button
              variant="ghost"
              className="text-[var(--error)] hover:bg-[var(--error)]/10"
              onClick={() => dispatch({ type: "SET_DELETE_OPEN", payload: true })}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Assistant
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isDeleteOpen} onOpenChange={(v) => dispatch({ type: "SET_DELETE_OPEN", payload: v })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[var(--error)]" />
                Delete Assistant
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{assistant.name}&quot;? This action cannot be undone.
                Note: The Docker container will NOT be automatically removed and must be cleaned up manually.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => dispatch({ type: "SET_DELETE_OPEN", payload: false })}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--error)] hover:bg-[var(--error)]/90"
                onClick={handleDelete}
                disabled={isActionLoading}
              >
                {isActionLoading ? "Deleting..." : "Delete Assistant"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
