"use client";

import { useState, useMemo } from "react";
import { GitBranch, Plus, Play, Save, Eye, Layers, CheckCircle, Clock, AlertCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { SummaryCard, FilterToolbar } from "@/components/shared/SummaryCards";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  mockPipelines,
  mockBusinesses,
  type Pipeline,
} from "@/lib/mock-data/crewclaw-governance";

export default function PipelinesPage() {
  const [pipelines] = useState<Pipeline[]>(mockPipelines);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const filteredPipelines = useMemo(() => {
    return pipelines.filter((pipeline) => {
      const matchesSearch =
        !searchQuery ||
        pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pipeline.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || pipeline.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [pipelines, searchQuery, filterStatus]);

  const summaryStats = useMemo(() => {
    const active = pipelines.filter((p) => p.status === "active").length;
    const draft = pipelines.filter((p) => p.status === "draft").length;
    const avgTime = Math.round(pipelines.reduce((acc, p) => acc + p.avgCompletionTime, 0) / (pipelines.length || 1));
    const failed = pipelines.filter((p) => p.status === "deprecated").length;
    return { active, draft, avgTime, failed };
  }, [pipelines]);

  const getStatusBadge = (status: Pipeline["status"]) => {
    const variants: Record<string, "success" | "secondary" | "warning" | "error"> = {
      draft: "secondary",
      testing: "warning",
      approved: "success",
      active: "success",
      deprecated: "error",
      archived: "secondary",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPipelineBusiness = (pipeline: Pipeline) => {
    return mockBusinesses.find((b) => b.id === pipeline.businessScope);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pipelines" description="Manage CI/CD and data processing pipelines" />
        <LoadingState message="Loading pipelines..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipelines"
        description="Define how tasks are executed, validated, tested, and promoted"
        action={
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Pipeline
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Active Pipelines" value={summaryStats.active} subtitle="Running" trend="up" />
        <SummaryCard title="Drafts" value={summaryStats.draft} subtitle="In development" />
        <SummaryCard title="Avg Completion" value={formatDuration(summaryStats.avgTime)} subtitle="Per execution" />
        <SummaryCard title="Failed Stages" value={summaryStats.failed} subtitle="Need attention" trend="down" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <FilterToolbar
            searchPlaceholder="Search pipelines..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                key: "status",
                label: "Filter by status",
                value: filterStatus,
                options: [
                  { value: "all", label: "All Statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "testing", label: "Testing" },
                  { value: "approved", label: "Approved" },
                  { value: "active", label: "Active" },
                  { value: "deprecated", label: "Deprecated" },
                  { value: "archived", label: "Archived" },
                ],
                onChange: setFilterStatus,
              },
            ]}
          />
        </CardHeader>
        <CardContent>
          {filteredPipelines.length === 0 ? (
            <EmptyState
              title="No Pipelines Found"
              message="No pipelines match your search criteria. Try adjusting your filters or create a new pipeline."
              actionLabel="Create Pipeline"
              onAction={() => setIsEditorOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Business Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead>Avg Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPipelines.map((pipeline) => {
                  const business = getPipelineBusiness(pipeline);
                  return (
                    <TableRow key={pipeline.id}>
                      <TableCell className="font-medium text-[var(--lavender)]">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-[var(--tropical-indigo)]" />
                          {pipeline.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{business?.name || pipeline.businessScope}</TableCell>
                      <TableCell>{getStatusBadge(pipeline.status)}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">v{pipeline.version}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{pipeline.stageCount}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{formatDuration(pipeline.avgCompletionTime)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPipeline(pipeline);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPipeline(pipeline);
                              setIsEditorOpen(true);
                            }}
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-[var(--tropical-indigo)]" />
              {selectedPipeline?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedPipeline && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stages">Stages</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-sm text-[var(--lavender-muted)] mb-1">Description</p>
                  <p className="text-[var(--lavender)]">{selectedPipeline.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Business Scope</p>
                    <p className="font-medium text-[var(--lavender)]">
                      {getPipelineBusiness(selectedPipeline)?.name || selectedPipeline.businessScope}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Status</p>
                    {getStatusBadge(selectedPipeline.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Stages</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedPipeline.stageCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Avg Completion</p>
                    <p className="font-medium text-[var(--lavender)]">{formatDuration(selectedPipeline.avgCompletionTime)}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stages" className="mt-4">
                <div className="space-y-3">
                  {[
                    { name: "Initialize", type: "stage", status: "success" },
                    { name: "Validation", type: "validation", status: "success" },
                    { name: "Testing", type: "testing", status: "success" },
                    { name: "Quality Gates", type: "approval", status: "pending" },
                    { name: "Reporting", type: "reporting", status: "pending" },
                    { name: "Completion", type: "completion", status: "pending" },
                  ].slice(0, selectedPipeline.stageCount).map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--night-lighter)]">
                      <div className="h-8 w-8 rounded-full bg-[var(--tropical-indigo)]/20 flex items-center justify-center text-sm font-medium text-[var(--tropical-indigo)]">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--lavender)]">{stage.name}</p>
                        <p className="text-xs text-[var(--lavender-muted)] capitalize">{stage.type}</p>
                      </div>
                      <Badge variant={stage.status === "success" ? "success" : "secondary"}>
                        {stage.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--night-lighter)]">
                    <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--lavender)]">Execution completed successfully</p>
                      <p className="text-xs text-[var(--dim-gray)]">2 hours ago • Duration: 3m 45s</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--night-lighter)]">
                    <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--lavender)]">Execution completed successfully</p>
                      <p className="text-xs text-[var(--dim-gray)]">5 hours ago • Duration: 4m 12s</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--night-lighter)]">
                    <AlertCircle className="h-5 w-5 text-[var(--warning)]" />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--lavender)]">Stage 4 failed - retry scheduled</p>
                      <p className="text-xs text-[var(--dim-gray)]">Yesterday • Duration: 2m 30s</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--tropical-indigo)]" />
                {selectedPipeline ? `Edit: ${selectedPipeline.name}` : "Create New Pipeline"}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Test & Publish
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 h-[600px]">
            <div className="col-span-1 p-4 rounded-lg bg-[var(--night-lighter)] border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--lavender)] mb-4">Stage Palette</h4>
              <div className="space-y-2">
                {[
                  { type: "Stage", icon: "Layers", color: "var(--tropical-indigo)" },
                  { type: "Validation", icon: "CheckCircle", color: "var(--success)" },
                  { type: "Testing", icon: "Play", color: "var(--warning)" },
                  { type: "Reporting", icon: "FileText", color: "var(--info)" },
                  { type: "Approval Gate", icon: "Shield", color: "var(--amethyst)" },
                  { type: "Retry", icon: "RotateCcw", color: "var(--dim-gray)" },
                  { type: "Completion", icon: "Check", color: "var(--success)" },
                ].map((stage) => (
                  <div
                    key={stage.type}
                    className="p-2 rounded bg-[var(--night-light)] border border-[var(--border)] cursor-pointer hover:border-[var(--tropical-indigo)]"
                  >
                    <span className="text-sm text-[var(--lavender)]">{stage.type}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 p-4 rounded-lg bg-[var(--night-lighter)] border border-[var(--border)] flex items-center justify-center">
              <div className="text-center">
                <Layers className="h-20 w-20 text-[var(--dim-gray)] mx-auto mb-4" />
                <p className="text-[var(--lavender)] mb-2">Pipeline Builder</p>
                <p className="text-sm text-[var(--lavender-muted)]">
                  Drag stages to build execution pipeline
                </p>
              </div>
            </div>
            <div className="col-span-1 p-4 rounded-lg bg-[var(--night-lighter)] border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--lavender)] mb-4">Stage Policy</h4>
              <p className="text-sm text-[var(--lavender-muted)]">
                Select a stage to configure:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--lavender-muted)]">
                <li>• Allowed assistant types</li>
                <li>• Quality gates</li>
                <li>• Required artifacts</li>
                <li>• Exit criteria</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
