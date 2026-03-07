"use client";

import { useState, useEffect, useMemo } from "react";
import { GitBranch, Plus, Play, Eye, Layers } from "lucide-react";
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
import { SummaryCard, FilterToolbar } from "@/components/shared/SummaryCards";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

interface Pipeline {
  id: string;
  name: string;
  business_scope: string;
  status: string;
  version: number;
  stage_count: number;
  avg_completion_time: number;
  description: string;
  last_modified: string;
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/pipelines");
      if (!response.ok) {
        throw new Error("Failed to fetch pipelines");
      }
      const data = await response.json();
      setPipelines(data.pipelines || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
    const avgTime = pipelines.length > 0 
      ? Math.round(pipelines.reduce((acc, p) => acc + p.avg_completion_time, 0) / pipelines.length)
      : 0;
    return { active, draft, avgTime };
  }, [pipelines]);

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

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pipelines" description="Manage CI/CD and data processing pipelines" />
        <ErrorState message={error} onRetry={fetchPipelines} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard title="Active Pipelines" value={summaryStats.active} subtitle="Running" trend="up" />
        <SummaryCard title="Drafts" value={summaryStats.draft} subtitle="In development" />
        <SummaryCard title="Avg Completion" value={formatDuration(summaryStats.avgTime)} subtitle="Per execution" />
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
                  { value: "active", label: "Active" },
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
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead>Avg Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPipelines.map((pipeline) => (
                  <TableRow key={pipeline.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-[var(--tropical-indigo)]" />
                        {pipeline.name}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(pipeline.status)}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">v{pipeline.version}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{pipeline.stage_count}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{formatDuration(pipeline.avg_completion_time)}</TableCell>
                    <TableCell className="text-right">
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
            <DialogTitle>{selectedPipeline?.name}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-[var(--lavender-muted)]">{selectedPipeline?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
