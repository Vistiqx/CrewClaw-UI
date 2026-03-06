"use client";

import { useState, useMemo } from "react";
import { Shield, Bot, CheckCircle, XCircle, AlertTriangle, FileText, MessageSquare, Cpu, History, Users, Building2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Switch } from "@/components/ui/Switch";
import { SummaryCard } from "@/components/shared/SummaryCards";
import { LoadingState } from "@/components/shared/LoadingState";
import { AssistantIdentityCard } from "@/components/assistant/AssistantIdentityCard";
import { PermissionMatrix } from "@/components/assistant/PermissionMatrix";
import {
  mockAssistants,
  mockRbacPolicies,
  mockModelAllows,
  mockBusinesses,
  mockTeams,
  mockModelRegistry,
  policyPacks,
  type Assistant,
} from "@/lib/mock-data/crewclaw-governance";

export default function AssistantsRbacPage() {
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(mockAssistants[0]?.id || "");
  const [isLoading] = useState(false);
  const [policies, setPolicies] = useState(mockRbacPolicies);
  const [modelAllows, setModelAllows] = useState(mockModelAllows);

  const selectedAssistant = useMemo(() => {
    return mockAssistants.find((a) => a.id === selectedAssistantId) || mockAssistants[0];
  }, [selectedAssistantId]);

  const assistantPolicy = useMemo(() => {
    return policies.find((p) => p.assistantId === selectedAssistant?.id);
  }, [policies, selectedAssistant]);

  const assistantModelAllows = useMemo(() => {
    return modelAllows.filter((m) => m.assistantId === selectedAssistant?.id);
  }, [modelAllows, selectedAssistant]);

  const summaryStats = useMemo(() => {
    if (!assistantPolicy) return { filePerms: 0, commPerms: 0, allowedModels: 0, approvalThreshold: 'medium' };
    const filePerms = [assistantPolicy.fileRead, assistantPolicy.fileWrite, assistantPolicy.fileEdit, assistantPolicy.fileDelete].filter(Boolean).length;
    const commPerms = [assistantPolicy.mayMessageHuman, assistantPolicy.mayUseChannels, assistantPolicy.mayMessageAssistants].filter(Boolean).length;
    const allowedModels = assistantModelAllows.filter(m => m.status === 'allowed').length;
    return { filePerms, commPerms, allowedModels, approvalThreshold: assistantPolicy.approvalThreshold };
  }, [assistantPolicy, assistantModelAllows]);

  const updatePolicy = (key: string, value: boolean | string) => {
    if (!selectedAssistant) return;
    setPolicies(prev => prev.map(p => 
      p.assistantId === selectedAssistant.id ? { ...p, [key]: value } : p
    ));
  };

  const toggleModelAllow = (modelId: string, currentStatus: string) => {
    if (!selectedAssistant) return;
    const newStatus = currentStatus === 'allowed' ? 'blocked' : 'allowed';
    setModelAllows(prev => prev.map(m => 
      m.assistantId === selectedAssistant.id && m.model === modelId 
        ? { ...m, status: newStatus as 'allowed' | 'blocked' | 'deprecated' } 
        : m
    ));
  };

  const applyPolicyPack = (packId: string) => {
    const pack = policyPacks.find(p => p.id === packId);
    if (!pack || !selectedAssistant) return;
    
    setPolicies(prev => prev.map(p => 
      p.assistantId === selectedAssistant.id 
        ? { 
            ...p, 
            fileRead: pack.fileRead,
            fileWrite: pack.fileWrite,
            fileEdit: pack.fileEdit,
            fileDelete: pack.fileDelete,
            mayMessageHuman: pack.mayMessageHuman,
            mayUseChannels: pack.mayUseChannels,
            mayMessageAssistants: pack.mayMessageAssistants,
            approvalThreshold: pack.approvalThreshold as 'low' | 'medium' | 'high' | 'critical',
          } 
        : p
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allowed': return <CheckCircle className="h-4 w-4 text-[var(--success)]" />;
      case 'blocked': return <XCircle className="h-4 w-4 text-[var(--error)]" />;
      case 'deprecated': return <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assistants RBAC" description="Manage role-based access control for assistants" />
        <LoadingState message="Loading RBAC data..." />
      </div>
    );
  }

  if (!selectedAssistant || !assistantPolicy) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assistants RBAC" description="Manage role-based access control for assistants" />
        <Card className="bg-[var(--night-light)] border-[var(--border)] p-8">
          <div className="text-center">
            <Bot className="h-12 w-12 text-[var(--dim-gray)] mx-auto mb-4" />
            <p className="text-[var(--lavender)]">No assistants available</p>
          </div>
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
                {mockAssistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AssistantIdentityCard
          assistant={selectedAssistant}
          businesses={mockBusinesses}
          teams={mockTeams}
        />

        <div className="grid grid-cols-2 gap-4">
          <SummaryCard title="File Permissions" value={summaryStats.filePerms} subtitle="Of 4 granted" />
          <SummaryCard title="Comm Permissions" value={summaryStats.commPerms} subtitle="Of 3 granted" />
          <SummaryCard title="Allowed Models" value={summaryStats.allowedModels} subtitle="In allowlist" />
          <SummaryCard 
            title="Approval Level" 
            value={summaryStats.approvalThreshold.charAt(0).toUpperCase() + summaryStats.approvalThreshold.slice(1)} 
            subtitle="Required for risky actions" 
          />
        </div>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4 mt-4">
          <Card className="bg-[var(--night-light)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--tropical-indigo)]" />
                Policy Packs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {policyPacks.map((pack) => (
                  <Button
                    key={pack.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => applyPolicyPack(pack.id)}
                  >
                    {pack.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-[var(--lavender-muted)] mt-3">
                Click a policy pack to apply its default permissions to this assistant
              </p>
            </CardContent>
          </Card>

          <PermissionMatrix
            permissions={assistantPolicy}
            approvalThreshold={assistantPolicy.approvalThreshold}
          />

          <Card className="bg-[var(--night-light)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--tropical-indigo)]" />
                File Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {[
                 { key: 'fileRead', label: 'Read Files', description: 'Access and read file contents' },
                 { key: 'fileWrite', label: 'Write Files', description: 'Create new files' },
                 { key: 'fileEdit', label: 'Edit Files', description: 'Modify existing files' },
                 { key: 'fileDelete', label: 'Delete Files', description: 'Permanently remove files' },
               ].map((perm) => (
                 <div key={perm.key} className="flex items-center justify-between p-3 rounded-lg bg-[var(--night-lighter)]">
                   <div>
                     <p className="font-medium text-[var(--lavender)]">{perm.label}</p>
                     <p className="text-xs text-[var(--lavender-muted)]">{perm.description}</p>
                   </div>
                   <Switch
                     checked={(assistantPolicy as unknown as Record<string, boolean>)[perm.key]}
                     onCheckedChange={(checked) => updatePolicy(perm.key, checked)}
                   />
                 </div>
               ))}
             </CardContent>
           </Card>
 
           <Card className="bg-[var(--night-light)] border-[var(--border)]">
             <CardHeader>
               <CardTitle className="text-base flex items-center gap-2">
                 <MessageSquare className="h-4 w-4 text-[var(--tropical-indigo)]" />
                 Communication Permissions
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {[
                 { key: 'mayMessageHuman', label: 'Message Human Owner', description: 'Send direct messages to the human owner' },
                 { key: 'mayUseChannels', label: 'Use Channels', description: 'Post to Discord, Slack, and other channels' },
                 { key: 'mayMessageAssistants', label: 'Message Other Assistants', description: 'Communicate with other assistants' },
               ].map((perm) => (
                 <div key={perm.key} className="flex items-center justify-between p-3 rounded-lg bg-[var(--night-lighter)]">
                   <div>
                     <p className="font-medium text-[var(--lavender)]">{perm.label}</p>
                     <p className="text-xs text-[var(--lavender-muted)]">{perm.description}</p>
                   </div>
                   <Switch
                     checked={(assistantPolicy as unknown as Record<string, boolean>)[perm.key]}
                     onCheckedChange={(checked) => updatePolicy(perm.key, checked)}
                   />
                 </div>
               ))}
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4 mt-4">
          <Card className="bg-[var(--night-light)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[var(--tropical-indigo)]" />
                Model Allowlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--lavender-muted)] mb-4">
                Default deny applies. Only explicitly allowlisted models may be used by this assistant.
              </p>
              <div className="space-y-2">
                {mockModelRegistry.map((model) => {
                  const allow = assistantModelAllows.find(m => m.model === model.model);
                  const status = allow?.status || 'blocked';
                  
                  return (
                    <div key={model.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--night-lighter)]">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <div>
                          <p className="font-medium text-[var(--lavender)]">
                            <span className="capitalize">{model.provider}</span> / {model.model}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {model.capabilityTags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs capitalize">{tag}</Badge>
                            ))}
                            <Badge 
                              variant={model.costTier === 'premium' ? 'error' : model.costTier === 'high' ? 'warning' : 'secondary'}
                              className="text-xs"
                            >
                              {model.costTier}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={status === 'allowed'}
                        onCheckedChange={() => toggleModelAllow(model.model, status)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4 mt-4">
          <Card className="bg-[var(--night-light)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--tropical-indigo)]" />
                Approval Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-sm text-[var(--lavender-muted)] mb-3">Current Approval Threshold</p>
                <Select 
                  value={assistantPolicy.approvalThreshold}
                  onValueChange={(value) => updatePolicy('approvalThreshold', value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Minimal oversight</SelectItem>
                    <SelectItem value="medium">Medium - Standard oversight</SelectItem>
                    <SelectItem value="high">High - Close oversight</SelectItem>
                    <SelectItem value="critical">Critical - Maximum oversight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-[var(--lavender)]">Actions Requiring Approval</h4>
                {[
                  { action: 'File deletion', level: 'high', icon: FileText },
                  { action: 'External message sending', level: 'medium', icon: MessageSquare },
                  { action: 'Premium model usage', level: 'medium', icon: Cpu },
                  { action: 'Secret access', level: 'high', icon: Shield },
                  { action: 'Workflow publishing', level: 'critical', icon: AlertTriangle },
                ].map((item) => {
                  const Icon = item.icon;
                  const requiresApproval = 
                    assistantPolicy.approvalThreshold === 'critical' ||
                    (assistantPolicy.approvalThreshold === 'high' && ['high', 'critical'].includes(item.level)) ||
                    (assistantPolicy.approvalThreshold === 'medium' && ['medium', 'high', 'critical'].includes(item.level));
                  
                  return (
                    <div key={item.action} className="flex items-center justify-between p-3 rounded-lg bg-[var(--night-lighter)]">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-[var(--dim-gray)]" />
                        <span className="text-[var(--lavender)]">{item.action}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={requiresApproval ? 'warning' : 'secondary'} className="text-xs">
                          {requiresApproval ? 'Requires Approval' : 'Auto-approved'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card className="bg-[var(--night-light)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--tropical-indigo)]" />
                Policy Audit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--night-lighter)]">
                  <History className="h-4 w-4 text-[var(--dim-gray)] mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--lavender)]">File write permission enabled</p>
                    <p className="text-xs text-[var(--dim-gray)]">2 days ago by admin</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--night-lighter)]">
                  <History className="h-4 w-4 text-[var(--dim-gray)] mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--lavender)]">Model gpt-4 added to allowlist</p>
                    <p className="text-xs text-[var(--dim-gray)]">5 days ago by admin</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--night-lighter)]">
                  <History className="h-4 w-4 text-[var(--dim-gray)] mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--lavender)]">Approval threshold changed to medium</p>
                    <p className="text-xs text-[var(--dim-gray)]">1 week ago by admin</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--night-lighter)]">
                  <History className="h-4 w-4 text-[var(--dim-gray)] mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--lavender)]">Assistant RBAC policy initialized</p>
                    <p className="text-xs text-[var(--dim-gray)]">2 weeks ago by system</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
