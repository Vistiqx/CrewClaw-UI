"use client";

import { useState, useMemo } from "react";
import { Workflow, Plus, GitBranch, Play, Save, Eye, CheckCircle, Clock, Archive } from "lucide-react";
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
  mockWorkflows,
  mockBusinesses,
  type Workflow as WorkflowType,
} from "@/lib/mock-data/crewclaw-governance";

export default function WorkflowsPage() {
  const [workflows] = useState<WorkflowType[]>(mockWorkflows);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        !searchQuery ||
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || workflow.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [workflows, searchQuery, filterStatus]);

  const summaryStats = useMemo(() => {
    const active = workflows.filter((w) => w.status === "active").length;
    const draft = workflows.filter((w) => w.status === "draft").length;
    const runsToday = workflows.reduce((acc, w) => acc + (w.status === "active" ? Math.floor(Math.random() * 50) : 0), 0);
    const blocked = workflows.filter((w) => w.status === "deprecated").length;
    return { active, draft, runsToday, blocked };
  }, [workflows]);

  const getStatusBadge = (status: WorkflowType["status"]) => {
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

  const getWorkflowBusiness = (workflow: WorkflowType) => {
    return mockBusinesses.find((b) => b.id === workflow.businessScope);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workflows" description="Design and manage automated workflows" />
        <LoadingState message="Loading workflows..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows"
        description="Define who communicates with whom and in what sequence"
        action={
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Active Workflows" value={summaryStats.active} subtitle="Running" trend="up" />
        <SummaryCard title="Draft Workflows" value={summaryStats.draft} subtitle="In development" />
        <SummaryCard title="Runs Today" value={summaryStats.runsToday} subtitle="Executions" trend="up" />
        <SummaryCard title="Blocked Runs" value={summaryStats.blocked} subtitle="Needs attention" trend="down" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <FilterToolbar
            searchPlaceholder="Search workflows..."
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
          {filteredWorkflows.length === 0 ? (
            <EmptyState
              title="No Workflows Found"
              message="No workflows match your search criteria. Try adjusting your filters or create a new workflow."
              actionLabel="Create Workflow"
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
                  <TableHead>Nodes</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map((workflow) => {
                  const business = getWorkflowBusiness(workflow);
                  return (
                    <TableRow key={workflow.id}>
                      <TableCell className="font-medium text-[var(--lavender)]">
                        <div className="flex items-center gap-2">
                          <Workflow className="h-4 w-4 text-[var(--tropical-indigo)]" />
                          {workflow.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{business?.name || workflow.businessScope}</TableCell>
                      <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">v{workflow.version}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{workflow.nodeCount}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">
                        {new Date(workflow.lastModified).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setIsEditorOpen(true);
                            }}
                          >
                            <GitBranch className="h-4 w-4" />
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
              <Workflow className="h-5 w-5 text-[var(--tropical-indigo)]" />
              {selectedWorkflow?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedWorkflow && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="canvas">Canvas Preview</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-sm text-[var(--lavender-muted)] mb-1">Description</p>
                  <p className="text-[var(--lavender)]">{selectedWorkflow.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Business Scope</p>
                    <p className="font-medium text-[var(--lavender)]">
                      {getWorkflowBusiness(selectedWorkflow)?.name || selectedWorkflow.businessScope}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Status</p>
                    {getStatusBadge(selectedWorkflow.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Version</p>
                    <p className="font-medium text-[var(--lavender)]">v{selectedWorkflow.version}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Nodes</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedWorkflow.nodeCount}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="canvas" className="mt-4">
                <div className="p-8 rounded-lg bg-[var(--night-lighter)] border border-[var(--border)] min-h-[300px] flex flex-col items-center justify-center">
                  <Workflow className="h-16 w-16 text-[var(--dim-gray)] mb-4" />
                  <p className="text-[var(--lavender)] mb-2">Workflow Canvas</p>
                  <p className="text-sm text-[var(--lavender-muted)] text-center max-w-md">
                    Visual workflow editor with drag-and-drop nodes (Human, Assistant, Council, Team, Action, Approval, Condition)
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Badge variant="secondary">{selectedWorkflow.nodeCount} nodes</Badge>
                    <Badge variant="secondary">v{selectedWorkflow.version}</Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="execution" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                  <h4 className="text-sm font-medium text-[var(--lavender)] mb-3">Lifecycle States</h4>
                  <div className="flex items-center gap-2">
                    {["draft", "testing", "approved", "active", "deprecated", "archived"].map((state, idx) => (
                      <div key={state} className="flex items-center">
                        <Badge 
                          variant={selectedWorkflow.status === state ? "success" : "secondary"}
                          className="capitalize"
                        >
                          {state}
                        </Badge>
                        {idx < 5 && <div className="w-4 h-px bg-[var(--border)] mx-1" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Test Run
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
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
                <GitBranch className="h-5 w-5 text-[var(--tropical-indigo)]" />
                {selectedWorkflow ? `Edit: ${selectedWorkflow.name}` : "Create New Workflow"}
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
              <h4 className="text-sm font-medium text-[var(--lavender)] mb-4">Node Palette</h4>
              <div className="space-y-2">
                {[
                  { type: "Human", icon: "User", color: "var(--tropical-indigo)" },
                  { type: "Assistant", icon: "Bot", color: "var(--success)" },
                  { type: "Council", icon: "Users", color: "var(--amethyst)" },
                  { type: "Team", icon: "Network", color: "var(--ultra-violet)" },
                  { type: "Action", icon: "Zap", color: "var(--warning)" },
                  { type: "Approval", icon: "CheckCircle", color: "var(--info)" },
                  { type: "Condition", icon: "GitBranch", color: "var(--dim-gray)" },
                ].map((node) => (
                  <div
                    key={node.type}
                    className="p-2 rounded bg-[var(--night-light)] border border-[var(--border)] cursor-pointer hover:border-[var(--tropical-indigo)]"
                  >
                    <span className="text-sm text-[var(--lavender)]">{node.type}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 p-4 rounded-lg bg-[var(--night-lighter)] border border-[var(--border)] flex items-center justify-center">
              <div className="text-center">
                <Workflow className="h-20 w-20 text-[var(--dim-gray)] mx-auto mb-4" />
                <p className="text-[var(--lavender)] mb-2">Workflow Canvas</p>
                <p className="text-sm text-[var(--lavender-muted)]">
                  Drag nodes from palette to build workflow
                </p>
              </div>
            </div>
            <div className="col-span-1 p-4 rounded-lg bg-[var(--night-lighter)] border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--lavender)] mb-4">Properties</h4>
              <p className="text-sm text-[var(--lavender-muted)]">
                Select a node to view and edit its properties
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
