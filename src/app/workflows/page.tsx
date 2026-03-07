"use client";

import { useState, useEffect, useMemo } from "react";
import { Workflow, Plus, GitBranch, Play, Save, Eye } from "lucide-react";
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
import { ErrorState } from "@/components/shared/ErrorState";

interface WorkflowType {
  id: string;
  name: string;
  business_scope: string;
  status: string;
  version: number;
  node_count: number;
  description: string;
  last_modified: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/workflows");
      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }
      const data = await response.json();
      setWorkflows(data.workflows || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
    return { active, draft, total: workflows.length };
  }, [workflows]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "secondary" | "warning" | "error"> = {
      draft: "secondary",
      testing: "warning",
      approved: "success",
      active: "success",
      deprecated: "error",
      archived: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workflows" description="Design and manage automated workflows" />
        <LoadingState message="Loading workflows..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workflows" description="Design and manage automated workflows" />
        <ErrorState message={error} onRetry={fetchWorkflows} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard title="Active Workflows" value={summaryStats.active} subtitle="Running" trend="up" />
        <SummaryCard title="Draft Workflows" value={summaryStats.draft} subtitle="In development" />
        <SummaryCard title="Total Workflows" value={summaryStats.total} subtitle="All workflows" />
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
                  { value: "active", label: "Active" },
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
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Nodes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-[var(--tropical-indigo)]" />
                        {workflow.name}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">v{workflow.version}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{workflow.node_count}</TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWorkflow?.name}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-[var(--lavender-muted)]">{selectedWorkflow?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
