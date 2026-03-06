"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, Play, Square, RotateCcw, Trash2, FileText, Settings, Edit3 } from "lucide-react";
import { EditFileModal } from "./components/EditFileModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface Business {
  id: string;
  name: string;
  prefix: string;
}

interface Assistant {
  id: number;
  name: string;
  business_id: string;
  business_name: string;
  channels: string[];
  status: "running" | "stopped" | "error";
  role: string | null;
}

const CHANNEL_OPTIONS = ["telegram", "slack", "discord", "signal", "email", "sms", "whatsapp"];

interface AssistantsState {
  assistants: Assistant[];
  businesses: Business[];
  filterStatus: string;
  filterBusiness: string;
  searchQuery: string;
  isCreateOpen: boolean;
  isLoading: boolean;
  newAssistant: {
    name: string;
    business_id: string;
    channels: string[];
    role: string;
  };
  editModal: {
    isOpen: boolean;
    assistantId: number;
    assistantName: string;
    fileName: string;
  };
  channelEditModal: {
    isOpen: boolean;
    assistantId: number;
    assistantName: string;
    currentChannels: string[];
  };
}

type AssistantsAction =
  | { type: "SET_ASSISTANTS"; payload: Assistant[] }
  | { type: "SET_BUSINESSES"; payload: Business[] }
  | { type: "SET_FILTER_STATUS"; payload: string }
  | { type: "SET_FILTER_BUSINESS"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_CREATE_OPEN"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_NEW_ASSISTANT"; payload: Partial<AssistantsState["newAssistant"]> }
  | { type: "TOGGLE_CHANNEL"; payload: string }
  | { type: "RESET_NEW_ASSISTANT" }
  | { type: "OPEN_EDIT_MODAL"; payload: { assistantId: number; assistantName: string; fileName: string } }
  | { type: "CLOSE_EDIT_MODAL" }
  | { type: "OPEN_CHANNEL_EDIT_MODAL"; payload: { assistantId: number; assistantName: string; currentChannels: string[] } }
  | { type: "CLOSE_CHANNEL_EDIT_MODAL" };

const initialState: AssistantsState = {
  assistants: [],
  businesses: [],
  filterStatus: "all",
  filterBusiness: "all",
  searchQuery: "",
  isCreateOpen: false,
  isLoading: true,
  newAssistant: {
    name: "",
    business_id: "",
    channels: [],
    role: "",
  },
  editModal: {
    isOpen: false,
    assistantId: 0,
    assistantName: "",
    fileName: "",
  },
  channelEditModal: {
    isOpen: false,
    assistantId: 0,
    assistantName: "",
    currentChannels: [],
  },
};

function assistantsReducer(state: AssistantsState, action: AssistantsAction): AssistantsState {
  switch (action.type) {
    case "SET_ASSISTANTS":
      return { ...state, assistants: action.payload };
    case "SET_BUSINESSES":
      return { ...state, businesses: action.payload };
    case "SET_FILTER_STATUS":
      return { ...state, filterStatus: action.payload };
    case "SET_FILTER_BUSINESS":
      return { ...state, filterBusiness: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_CREATE_OPEN":
      return { ...state, isCreateOpen: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_NEW_ASSISTANT":
      return { ...state, newAssistant: { ...state.newAssistant, ...action.payload } };
    case "TOGGLE_CHANNEL": {
      const channels = state.newAssistant.channels.includes(action.payload)
        ? state.newAssistant.channels.filter(c => c !== action.payload)
        : [...state.newAssistant.channels, action.payload];
      return { ...state, newAssistant: { ...state.newAssistant, channels } };
    }
    case "RESET_NEW_ASSISTANT":
      return { ...state, newAssistant: initialState.newAssistant };
    case "OPEN_EDIT_MODAL":
      return {
        ...state,
        editModal: {
          isOpen: true,
          assistantId: action.payload.assistantId,
          assistantName: action.payload.assistantName,
          fileName: action.payload.fileName,
        },
      };
    case "CLOSE_EDIT_MODAL":
      return {
        ...state,
        editModal: {
          ...state.editModal,
          isOpen: false,
        },
      };
    case "OPEN_CHANNEL_EDIT_MODAL":
      return {
        ...state,
        channelEditModal: {
          isOpen: true,
          assistantId: action.payload.assistantId,
          assistantName: action.payload.assistantName,
          currentChannels: action.payload.currentChannels,
        },
      };
    case "CLOSE_CHANNEL_EDIT_MODAL":
      return {
        ...state,
        channelEditModal: {
          ...state.channelEditModal,
          isOpen: false,
        },
      };
    default:
      return state;
  }
}

export default function AssistantsPage() {
  const [state, dispatch] = useReducer(assistantsReducer, initialState);
  const { assistants, businesses, filterStatus, filterBusiness, searchQuery, isCreateOpen, isLoading, newAssistant } = state;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bizRes, assistantsRes] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/assistants"),
      ]);
      const businessesData = await bizRes.json();
      const assistantsData = await assistantsRes.json();
      dispatch({ type: "SET_BUSINESSES", payload: businessesData });
      dispatch({ type: "SET_ASSISTANTS", payload: assistantsData });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const filteredAssistants = assistants.filter((a) => {
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && a.status === "running") ||
      (filterStatus === "inactive" && a.status === "stopped");
    const matchesBusiness = filterBusiness === "all" || a.business_id === filterBusiness;
    const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesBusiness && matchesSearch;
  });

  const getSelectedBusinessPrefix = () => {
    const biz = businesses.find(b => b.id === newAssistant.business_id);
    return biz?.prefix || "";
  };

  const handleCreateAssistant = async () => {
    if (!newAssistant.name || !newAssistant.business_id || newAssistant.channels.length === 0) return;
    
    const selectedBiz = businesses.find(b => b.id === newAssistant.business_id);
    const prefix = selectedBiz?.prefix || "";
    
    try {
      const res = await fetch(`/api/businesses/${newAssistant.business_id}/assistants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${prefix}-${newAssistant.name}`,
          channels: newAssistant.channels,
          role: newAssistant.role,
        }),
      });

      if (res.ok) {
        dispatch({ type: "SET_CREATE_OPEN", payload: false });
        dispatch({ type: "RESET_NEW_ASSISTANT" });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create assistant:", error);
    }
  };

  const handleStart = async (id: number) => {
    try {
      await fetch(`/api/assistants/${id}/start`, { method: "POST" });
      fetchData();
    } catch (error) {
      console.error("Failed to start assistant:", error);
    }
  };

  const handleStop = async (id: number) => {
    try {
      await fetch(`/api/assistants/${id}/stop`, { method: "POST" });
      fetchData();
    } catch (error) {
      console.error("Failed to stop assistant:", error);
    }
  };

  const handleRestart = async (id: number) => {
    try {
      await fetch(`/api/assistants/${id}/restart`, { method: "POST" });
      fetchData();
    } catch (error) {
      console.error("Failed to restart assistant:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assistant?")) return;
    try {
      await fetch(`/api/assistants/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Failed to delete assistant:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge variant="success">Running</Badge>;
      case "stopped":
        return <Badge variant="secondary">Stopped</Badge>;
      case "error":
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[var(--lavender)]">Assistants</h1>
        </div>
        <Button onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: true })}>
          <Plus className="h-4 w-4 mr-2" />
          Add Assistant
        </Button>
      </div>

      <Card className="bg-night-light border border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--lavender-muted)]" />
              <Input
                placeholder="Search assistants..."
                value={searchQuery}
                onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => dispatch({ type: "SET_FILTER_STATUS", payload: v })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBusiness} onValueChange={(v) => dispatch({ type: "SET_FILTER_BUSINESS", payload: v })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                {businesses.map((biz) => (
                  <SelectItem key={biz.id} value={biz.id}>{biz.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-[var(--lavender-muted)]">Loading...</div>
          ) : filteredAssistants.length === 0 ? (
            <div className="text-center py-8 text-[var(--lavender-muted)]">No assistants found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssistants.map((assistant) => (
                  <TableRow key={assistant.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      {assistant.name}
                    </TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">
                      {assistant.business_name || assistant.business_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(assistant.channels || [assistant.channels?.[0] || 'telegram']).map((ch) => (
                          <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(assistant.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-end gap-1">
                          {["SOUL", "AGENTS", "IDENTITY", "MEMORY"].map((file) => (
                            <Button
                              key={file}
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                dispatch({
                                  type: "OPEN_EDIT_MODAL",
                                  payload: {
                                    assistantId: assistant.id,
                                    assistantName: assistant.name,
                                    fileName: `${file}.md`,
                                  },
                                })
                              }
                              title={`Edit ${file}.md`}
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              {file}
                            </Button>
                          ))}
                        </div>
                        <div className="flex justify-end gap-1">
                          {["TOOLS", "HEARTBEAT", "USER"].map((file) => (
                            <Button
                              key={file}
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                dispatch({
                                  type: "OPEN_EDIT_MODAL",
                                  payload: {
                                    assistantId: assistant.id,
                                    assistantName: assistant.name,
                                    fileName: `${file}.md`,
                                  },
                                })
                              }
                              title={`Edit ${file}.md`}
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              {file}
                            </Button>
                          ))}
                          {assistant.status === "running" ? (
                            <Button size="sm" variant="ghost" onClick={() => handleStop(assistant.id)} title="Stop">
                              <Square className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => handleStart(assistant.id)} title="Start">
                              <Play className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleRestart(assistant.id)} title="Restart">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(assistant.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={(open) => dispatch({ type: "SET_CREATE_OPEN", payload: open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Assistant</DialogTitle>
            <DialogDescription>Add a new assistant to your business</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Business</label>
              <Select
                value={newAssistant.business_id}
                onValueChange={(v) => dispatch({ type: "SET_NEW_ASSISTANT", payload: { business_id: v } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business..." />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((biz) => (
                    <SelectItem key={biz.id} value={biz.id}>{biz.name} ({biz.prefix})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Assistant Name</label>
              <Input
                placeholder={`${getSelectedBusinessPrefix()}-my-assistant`}
                value={newAssistant.name}
                onChange={(e) => dispatch({ type: "SET_NEW_ASSISTANT", payload: { name: e.target.value.replace(/\s+/g, '-') } })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Channels</label>
              <div className="grid grid-cols-2 gap-2">
                {CHANNEL_OPTIONS.map((channel) => (
                  <label
                    key={channel}
                    className="flex items-center gap-2 p-2 rounded border border-border hover:bg-night-lighter cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newAssistant.channels.includes(channel)}
                      onChange={() => dispatch({ type: "TOGGLE_CHANNEL", payload: channel })}
                      className="rounded"
                    />
                    <span className="text-sm text-[var(--lavender)] capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Role</label>
              <Input
                placeholder="e.g., Sales Assistant, Support Bot"
                value={newAssistant.role}
                onChange={(e) => dispatch({ type: "SET_NEW_ASSISTANT", payload: { role: e.target.value } })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: false })}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAssistant}
              disabled={!newAssistant.name || !newAssistant.business_id || newAssistant.channels.length === 0}
            >
              Create Assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditFileModal
        isOpen={state.editModal.isOpen}
        onClose={() => dispatch({ type: "CLOSE_EDIT_MODAL" })}
        assistantId={state.editModal.assistantId}
        assistantName={state.editModal.assistantName}
        fileName={state.editModal.fileName}
      />
    </div>
  );
}
