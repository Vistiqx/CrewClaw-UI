"use client";

import { useState, useEffect, useMemo } from "react";
import { Shield, Bot, CheckCircle, XCircle, AlertCircle, History } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { SummaryCard } from "@/components/shared/SummaryCards";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

interface Assistant {
  id: number;
  name: string;
  business_id: string;
  business_name?: string;
  channel: string;
  role: string | null;
  status: string;
  created_at: string;
}

interface RbacPolicy {
  assistant_id: number;
  file_read: boolean;
  file_write: boolean;
  file_edit: boolean;
  file_delete: boolean;
  may_message_human: boolean;
  may_use_channels: boolean;
  may_message_assistants: boolean;
  approval_threshold: string;
}

interface ModelAllow {
  id: number;
  assistant_id: number;
  provider: string;
  model: string;
  status: string;
}

export default function AssistantsRbacPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");
  const [rbacPolicy, setRbacPolicy] = useState<RbacPolicy | null>(null);
  const [modelAllows, setModelAllows] = useState<ModelAllow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssistants();
  }, []);

  useEffect(() => {
    if (selectedAssistantId) {
      fetchAssistantDetails(parseInt(selectedAssistantId));
    }
  }, [selectedAssistantId]);

  const fetchAssistants = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/assistants");
      if (!response.ok) {
        throw new Error("Failed to fetch assistants");
      }
      const data = await response.json();
      setAssistants(data.assistants || []);
      if (data.assistants && data.assistants.length > 0) {
        setSelectedAssistantId(data.assistants[0].id.toString());
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssistantDetails = async (assistantId: number) => {
    try {
      const [rbacRes, modelsRes] = await Promise.all([
        fetch(`/api/assistants/${assistantId}/rbac`),
        fetch(`/api/assistants/${assistantId}/models`),
      ]);
      
      if (rbacRes.ok) {
        const rbacData = await rbacRes.json();
        setRbacPolicy(rbacData.policy);
      }
      
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModelAllows(modelsData.models || []);
      }
    } catch (err) {
      console.error("Failed to fetch assistant details", err);
    }
  };

  const selectedAssistant = useMemo(() => {
    return assistants.find((a) => a.id.toString() === selectedAssistantId);
  }, [assistants, selectedAssistantId]);

  const summaryStats = useMemo(() => {
    if (!rbacPolicy) return { filePerms: 0, commPerms: 0, allowedModels: 0, approvalThreshold: 'medium' };
    const filePerms = [rbacPolicy.file_read, rbacPolicy.file_write, rbacPolicy.file_edit, rbacPolicy.file_delete].filter(Boolean).length;
    const commPerms = [rbacPolicy.may_message_human, rbacPolicy.may_use_channels, rbacPolicy.may_message_assistants].filter(Boolean).length;
    const allowedModels = modelAllows.filter(m => m.status === 'allowed').length;
    return { filePerms, commPerms, allowedModels, approvalThreshold: rbacPolicy.approval_threshold };
  }, [rbacPolicy, modelAllows]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assistants RBAC" description="Manage role-based access control for assistants" />
        <LoadingState message="Loading RBAC data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assistants RBAC" description="Manage role-based access control for assistants" />
        <ErrorState message={error} onRetry={fetchAssistants} />
      </div>
    );
  }

  if (assistants.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assistants RBAC" description="Manage role-based access control for assistants" />
        <Card className="bg-[var(--night-light)] border-[var(--border)] p-8">
          <EmptyState
            title="No Assistants Found"
            message="Create assistants first to manage their RBAC policies."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistants RBAC"
        description="Manage role-based access control, permissions, and model allowlists"
      />

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[var(--tropical-indigo)]" />
              <span className="text-sm text-[var(--lavender-muted)]">Select Assistant:</span>
            </div>
            <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id.toString()}>
                    {assistant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedAssistant && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[var(--night-light)] border-[var(--border)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-[var(--tropical-indigo)]/20 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-[var(--tropical-indigo)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--lavender)]">{selectedAssistant.name}</h4>
                    <p className="text-sm text-[var(--lavender-muted)]">{selectedAssistant.business_name || selectedAssistant.business_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[var(--lavender-muted)]">Role:</span>
                    <span className="ml-2 text-[var(--lavender)]">{selectedAssistant.role || "Not set"}</span>
                  </div>
                  <div>
                    <span className="text-[var(--lavender-muted)]">Channel:</span>
                    <span className="ml-2 text-[var(--lavender)]">{selectedAssistant.channel}</span>
                  </div>
                  <div>
                    <span className="text-[var(--lavender-muted)]">Status:</span>
                    <Badge variant={selectedAssistant.status === 'running' ? 'success' : 'secondary'} className="ml-2">
                      {selectedAssistant.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <SummaryCard title="File Permissions" value={summaryStats.filePerms} subtitle="Of 4 granted" />
              <SummaryCard title="Comm Permissions" value={summaryStats.commPerms} subtitle="Of 3 granted" />
              <SummaryCard title="Allowed Models" value={summaryStats.allowedModels} subtitle="In allowlist" />
              <SummaryCard title="Approval Level" value={summaryStats.approvalThreshold} subtitle="Required threshold" />
            </div>
          </div>

          <Tabs defaultValue="permissions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4 mt-4">
              {rbacPolicy ? (
                <>
                  <Card className="bg-[var(--night-light)] border-[var(--border)]">
                    <CardHeader>
                      <CardTitle className="text-base">File Operations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { key: 'file_read', label: 'Read Files' },
                        { key: 'file_write', label: 'Write Files' },
                        { key: 'file_edit', label: 'Edit Files' },
                        { key: 'file_delete', label: 'Delete Files' },
                      ].map((perm) => (
                        <div key={perm.key} className="flex items-center justify-between p-2 rounded bg-[var(--night-lighter)]">
                          <span className="text-[var(--lavender)]">{perm.label}</span>
                          {rbacPolicy[perm.key as keyof RbacPolicy] ? (
                            <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                          ) : (
                            <XCircle className="h-4 w-4 text-[var(--dim-gray)]" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--night-light)] border-[var(--border)]">
                    <CardHeader>
                      <CardTitle className="text-base">Communication</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { key: 'may_message_human', label: 'Message Human Owner' },
                        { key: 'may_use_channels', label: 'Use Channels' },
                        { key: 'may_message_assistants', label: 'Message Other Assistants' },
                      ].map((perm) => (
                        <div key={perm.key} className="flex items-center justify-between p-2 rounded bg-[var(--night-lighter)]">
                          <span className="text-[var(--lavender)]">{perm.label}</span>
                          {rbacPolicy[perm.key as keyof RbacPolicy] ? (
                            <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                          ) : (
                            <XCircle className="h-4 w-4 text-[var(--dim-gray)]" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <EmptyState title="No RBAC Policy" message="RBAC policy not configured for this assistant." />
              )}
            </TabsContent>

            <TabsContent value="models" className="space-y-4 mt-4">
              {modelAllows.length > 0 ? (
                <Card className="bg-[var(--night-light)] border-[var(--border)]">
                  <CardHeader>
                    <CardTitle className="text-base">Allowed Models</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {modelAllows.map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-2 rounded bg-[var(--night-lighter)]">
                        <div>
                          <span className="text-[var(--lavender)] capitalize">{model.provider}</span>
                          <span className="text-[var(--lavender-muted)] mx-1">/</span>
                          <span className="text-[var(--tropical-indigo)]">{model.model}</span>
                        </div>
                        <Badge variant={model.status === 'allowed' ? 'success' : 'secondary'}>
                          {model.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <EmptyState title="No Models" message="No model allowlist configured for this assistant." />
              )}
            </TabsContent>

            <TabsContent value="audit" className="space-y-4 mt-4">
              <Card className="bg-[var(--night-light)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-[var(--tropical-indigo)]" />
                    Audit History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState title="No Audit History" message="Policy changes will be tracked here." />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
