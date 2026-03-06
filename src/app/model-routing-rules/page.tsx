"use client";

import { useState, useMemo } from "react";
import { Route, Play, AlertCircle, CheckCircle, XCircle, Info, Bot, Workflow, Users, Globe } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { SummaryCard, FilterToolbar } from "@/components/shared/SummaryCards";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { RuntimePreview } from "@/components/assistant/AssistantRuntimePreview";
import {
  mockRoutingRules,
  mockModelRegistry,
  mockApiKeys,
  mockAssistants,
  type ModelRoutingRule,
  type Assistant,
} from "@/lib/mock-data/crewclaw-governance";

export default function ModelRoutingRulesPage() {
  const [rules] = useState<ModelRoutingRule[]>(mockRoutingRules);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [isLoading] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const [simulationParams, setSimulationParams] = useState({
    assistantId: "",
    workflowId: "",
    taskCriticality: "medium",
    teamId: "",
  });

  const [simulationResult, setSimulationResult] = useState<{
    selectedProvider: string;
    selectedModel: string;
    selectedApiKeyRef: string;
    sourceOfDecision: string;
    allowlistStatus: "allowed" | "blocked" | "pending";
    blockedReason?: string;
    requiresApproval?: boolean;
    approvalReason?: string;
    resolutionChain: string[];
  } | null>(null);

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        !searchQuery ||
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.provider.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || rule.status === filterStatus;
      const matchesScope = filterScope === "all" || rule.scope === filterScope;
      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [rules, searchQuery, filterStatus, filterScope]);

  const summaryStats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.status === "active").length;
    const blockedResolutions = 0;
    const deprecatedHits = rules.filter((r) => r.status === "inactive").length;
    const escalations = 0;
    return { total, active, blockedResolutions, deprecatedHits, escalations };
  }, [rules]);

  const runSimulation = () => {
    const assistant = mockAssistants.find((a) => a.id === simulationParams.assistantId);
    
    if (!assistant) {
      setSimulationResult({
        selectedProvider: "",
        selectedModel: "",
        selectedApiKeyRef: "",
        sourceOfDecision: "none",
        allowlistStatus: "blocked",
        blockedReason: "No assistant selected",
        resolutionChain: [],
      });
      return;
    }

    const resolutionChain: string[] = [];
    let selectedProvider = "";
    let selectedModel = "";
    let selectedApiKeyRef = "";
    let sourceOfDecision = "";
    let allowlistStatus: "allowed" | "blocked" | "pending" = "blocked";
    let blockedReason = "";
    let requiresApproval = false;
    let approvalReason = "";

    resolutionChain.push("Starting resolution...");

    const activeRules = rules.filter((r) => r.status === "active");

    const assistantOverrideRule = activeRules.find(
      (r) => r.scope === "assistant" && r.condition.assistantClass === assistant.operatingMode
    );

    if (assistantOverrideRule) {
      selectedProvider = assistantOverrideRule.provider;
      selectedModel = assistantOverrideRule.model;
      selectedApiKeyRef = assistantOverrideRule.apiKeyRef;
      sourceOfDecision = "assistant_override";
      resolutionChain.push(`Found assistant override rule: ${assistantOverrideRule.name}`);
    } else {
      resolutionChain.push("No assistant override found");

      const workflowRule = activeRules.find(
        (r) => r.scope === "workflow" && r.condition.workflowId === simulationParams.workflowId
      );

      if (workflowRule) {
        selectedProvider = workflowRule.provider;
        selectedModel = workflowRule.model;
        selectedApiKeyRef = workflowRule.apiKeyRef;
        sourceOfDecision = "workflow_step_rule";
        resolutionChain.push(`Found workflow rule: ${workflowRule.name}`);
      } else {
        resolutionChain.push("No workflow rule found");

        const teamRule = activeRules.find(
          (r) => r.scope === "team" && r.condition.teamId === simulationParams.teamId
        );

        if (teamRule) {
          selectedProvider = teamRule.provider;
          selectedModel = teamRule.model;
          selectedApiKeyRef = teamRule.apiKeyRef;
          sourceOfDecision = "team_default";
          resolutionChain.push(`Found team default: ${teamRule.name}`);
        } else {
          resolutionChain.push("No team default found, using global default");
          selectedProvider = assistant.defaultProvider;
          selectedModel = assistant.defaultModel;
          selectedApiKeyRef = assistant.defaultApiKeyRef;
          sourceOfDecision = "global_default";
        }
      }
    }

    const modelEntry = mockModelRegistry.find(
      (m) => m.provider === selectedProvider && m.model === selectedModel
    );

    if (!modelEntry) {
      allowlistStatus = "blocked";
      blockedReason = `Model ${selectedProvider}/${selectedModel} not found in registry`;
      resolutionChain.push("FAIL: Model not in registry");
    } else if (modelEntry.status === "blocked") {
      allowlistStatus = "blocked";
      blockedReason = "Model is blocked in registry";
      resolutionChain.push("FAIL: Model is blocked");
    } else if (modelEntry.status === "deprecated") {
      allowlistStatus = "blocked";
      blockedReason = "Model is deprecated";
      requiresApproval = true;
      approvalReason = "Using deprecated model requires approval";
      resolutionChain.push("WARN: Model is deprecated, requires approval");
    } else {
      const apiKey = mockApiKeys.find((k) => k.id === selectedApiKeyRef);
      if (!apiKey || apiKey.status !== "active") {
        allowlistStatus = "blocked";
        blockedReason = "Required API key is not active";
        resolutionChain.push("FAIL: API key not active");
      } else if (modelEntry.costTier === "premium") {
        allowlistStatus = "pending";
        requiresApproval = true;
        approvalReason = "Premium model usage requires approval";
        resolutionChain.push("CHECK: Premium model requires approval");
      } else {
        allowlistStatus = "allowed";
        resolutionChain.push("PASS: All checks passed");
      }
    }

    setSimulationResult({
      selectedProvider,
      selectedModel,
      selectedApiKeyRef,
      sourceOfDecision,
      allowlistStatus,
      blockedReason,
      requiresApproval,
      approvalReason,
      resolutionChain,
    });
  };

  const getStatusBadge = (status: ModelRoutingRule["status"]) => {
    const variants: Record<string, "success" | "secondary" | "warning"> = {
      active: "success",
      inactive: "secondary",
      draft: "warning",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getScopeIcon = (scope: ModelRoutingRule["scope"]) => {
    switch (scope) {
      case "global":
        return <Globe className="h-4 w-4" />;
      case "workflow":
        return <Workflow className="h-4 w-4" />;
      case "team":
        return <Users className="h-4 w-4" />;
      case "assistant":
        return <Bot className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Model Routing Rules" description="Configure model selection and routing" />
        <LoadingState message="Loading routing rules..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Routing Rules"
        description="Define how model selection happens with allowlist-first enforcement"
        action={
          <Button onClick={() => setIsSimulatorOpen(true)}>
            <Play className="h-4 w-4 mr-2" />
            Simulate Resolution
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard title="Active Rules" value={summaryStats.active} subtitle="In effect" trend="up" />
        <SummaryCard title="Total Rules" value={summaryStats.total} subtitle="Configured" />
        <SummaryCard title="Blocked" value={summaryStats.blockedResolutions} subtitle="Failed allowlist" trend="down" />
        <SummaryCard title="Deprecated Hits" value={summaryStats.deprecatedHits} subtitle="Old models" trend="down" />
        <SummaryCard title="Escalations" value={summaryStats.escalations} subtitle="Pending approval" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <FilterToolbar
            searchPlaceholder="Search routing rules..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                key: "status",
                label: "Filter by status",
                value: filterStatus,
                options: [
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "draft", label: "Draft" },
                ],
                onChange: setFilterStatus,
              },
              {
                key: "scope",
                label: "Filter by scope",
                value: filterScope,
                options: [
                  { value: "all", label: "All Scopes" },
                  { value: "global", label: "Global" },
                  { value: "workflow", label: "Workflow" },
                  { value: "team", label: "Team" },
                  { value: "assistant", label: "Assistant" },
                ],
                onChange: setFilterScope,
              },
            ]}
          />
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <EmptyState
              title="No Routing Rules Found"
              message="No routing rules match your search criteria. Try adjusting your filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Target Model</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-[var(--tropical-indigo)]" />
                        {rule.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[var(--lavender-muted)] capitalize">
                        {getScopeIcon(rule.scope)}
                        {rule.scope}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-[var(--lavender-muted)]">
                        {Object.entries(rule.condition)
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <span key={k} className="inline-block mr-2">
                              {k}: <span className="text-[var(--lavender)]">{v}</span>
                            </span>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="capitalize text-[var(--lavender)]">{rule.provider}</span>
                        <span className="text-[var(--lavender-muted)] mx-1">/</span>
                        <span className="text-[var(--tropical-indigo)]">{rule.model}</span>
                      </div>
                      <div className="text-xs text-[var(--dim-gray)] font-mono mt-1">{rule.apiKeyRef}</div>
                    </TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{rule.priority}</TableCell>
                    <TableCell>{getStatusBadge(rule.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSimulatorOpen} onOpenChange={setIsSimulatorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-[var(--tropical-indigo)]" />
              Model Resolution Simulator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Assistant</label>
                <Select
                  value={simulationParams.assistantId}
                  onValueChange={(v) =>
                    setSimulationParams((p) => ({ ...p, assistantId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAssistants.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Workflow</label>
                <Select
                  value={simulationParams.workflowId}
                  onValueChange={(v) =>
                    setSimulationParams((p) => ({ ...p, workflowId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workflow (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="wf-1">Financial Report Generation</SelectItem>
                    <SelectItem value="wf-2">Legal Contract Review</SelectItem>
                    <SelectItem value="wf-3">Sales Lead Qualification</SelectItem>
                    <SelectItem value="wf-4">Security Incident Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Task Criticality</label>
                <Select
                  value={simulationParams.taskCriticality}
                  onValueChange={(v) =>
                    setSimulationParams((p) => ({ ...p, taskCriticality: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Team</label>
                <Select
                  value={simulationParams.teamId}
                  onValueChange={(v) =>
                    setSimulationParams((p) => ({ ...p, teamId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="team-1">Finance Team</SelectItem>
                    <SelectItem value="team-2">Legal Team</SelectItem>
                    <SelectItem value="team-3">Sales Team A</SelectItem>
                    <SelectItem value="team-4">Operations Team B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={runSimulation} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Run Simulation
            </Button>

            {simulationResult && (
              <Tabs defaultValue="result" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="result">Resolution Result</TabsTrigger>
                  <TabsTrigger value="chain">Resolution Chain</TabsTrigger>
                </TabsList>
                <TabsContent value="result" className="mt-4">
                  <RuntimePreview
                    provider={simulationResult.selectedProvider}
                    model={simulationResult.selectedModel}
                    apiKeyRef={simulationResult.selectedApiKeyRef}
                    sourceOfDecision={simulationResult.sourceOfDecision}
                    allowlistStatus={simulationResult.allowlistStatus}
                    blockedReason={simulationResult.blockedReason}
                    requiresApproval={simulationResult.requiresApproval}
                    approvalReason={simulationResult.approvalReason}
                  />
                </TabsContent>
                <TabsContent value="chain" className="mt-4">
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 space-y-2">
                      {simulationResult.resolutionChain.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-[var(--dim-gray)] font-mono">{idx + 1}.</span>
                          <span
                            className={
                              step.startsWith("FAIL")
                                ? "text-[var(--error)]"
                                : step.startsWith("WARN")
                                ? "text-[var(--warning)]"
                                : step.startsWith("PASS")
                                ? "text-[var(--success)]"
                                : "text-[var(--lavender)]"
                            }
                          >
                            {step}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
