"use client";

import { useState, useMemo } from "react";
import { Cpu, Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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
import { mockModelRegistry, type ModelRegistryEntry } from "@/lib/mock-data/crewclaw-governance";

export default function ModelRegistryPage() {
  const [models] = useState<ModelRegistryEntry[]>(mockModelRegistry);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [isLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelRegistryEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch =
        !searchQuery ||
        model.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.capabilityTags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === "all" || model.status === filterStatus;
      const matchesProvider = filterProvider === "all" || model.provider === filterProvider;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [models, searchQuery, filterStatus, filterProvider]);

  const summaryStats = useMemo(() => {
    const total = models.length;
    const active = models.filter((m) => m.status === "active").length;
    const blocked = models.filter((m) => m.status === "blocked").length;
    const deprecated = models.filter((m) => m.status === "deprecated").length;
    return { total, active, blocked, deprecated };
  }, [models]);

  const getStatusBadge = (status: ModelRegistryEntry["status"]) => {
    const variants: Record<string, "success" | "error" | "warning"> = {
      active: "success",
      blocked: "error",
      deprecated: "warning",
    };
    const icons = {
      active: <CheckCircle className="h-3 w-3 mr-1" />,
      blocked: <XCircle className="h-3 w-3 mr-1" />,
      deprecated: <AlertTriangle className="h-3 w-3 mr-1" />,
    };
    return (
      <Badge variant={variants[status]} className="flex items-center w-fit">
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const getCostTierBadge = (tier: ModelRegistryEntry["costTier"]) => {
    const colors: Record<string, string> = {
      free: "bg-[var(--success)]/10 text-[var(--success)]",
      low: "bg-[var(--info)]/10 text-[var(--info)]",
      medium: "bg-[var(--warning)]/10 text-[var(--warning)]",
      high: "bg-[var(--sunset-orange)]/10 text-[var(--sunset-orange)]",
      premium: "bg-[var(--error)]/10 text-[var(--error)]",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[tier]}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const providers = Array.from(new Set(models.map((m) => m.provider)));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Model Registry" description="Manage AI model configurations and capabilities" />
        <LoadingState message="Loading model registry..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Registry"
        description="Canonical registry of available AI models for CrewClaw routing"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Models" value={summaryStats.total} subtitle="Registered models" />
        <SummaryCard title="Active Models" value={summaryStats.active} subtitle="Available for use" trend="up" />
        <SummaryCard title="Blocked" value={summaryStats.blocked} subtitle="Not available" trend="down" />
        <SummaryCard title="Deprecated" value={summaryStats.deprecated} subtitle="Migration recommended" trend="down" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <FilterToolbar
            searchPlaceholder="Search models..."
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
                  { value: "blocked", label: "Blocked" },
                  { value: "deprecated", label: "Deprecated" },
                ],
                onChange: setFilterStatus,
              },
              {
                key: "provider",
                label: "Filter by provider",
                value: filterProvider,
                options: [
                  { value: "all", label: "All Providers" },
                  ...providers.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
                ],
                onChange: setFilterProvider,
              },
            ]}
          />
        </CardHeader>
        <CardContent>
          {filteredModels.length === 0 ? (
            <EmptyState
              title="No Models Found"
              message="No models match your search criteria. Try adjusting your filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Context Window</TableHead>
                  <TableHead>Cost Tier</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="capitalize font-medium text-[var(--lavender)]">
                      {model.provider}
                    </TableCell>
                    <TableCell className="text-[var(--lavender)]">{model.model}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.capabilityTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs capitalize">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">
                      {(model.contextWindow / 1000).toFixed(0)}k
                    </TableCell>
                    <TableCell>{getCostTierBadge(model.costTier)}</TableCell>
                    <TableCell className="capitalize text-[var(--lavender-muted)]">{model.latencyTier}</TableCell>
                    <TableCell>{getStatusBadge(model.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedModel(model);
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[var(--tropical-indigo)]" />
              {selectedModel?.provider} / {selectedModel?.model}
            </DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-sm text-[var(--lavender-muted)] mb-1">Description</p>
                <p className="text-[var(--lavender)]">{selectedModel.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-sm text-[var(--lavender-muted)] mb-1">Context Window</p>
                  <p className="font-medium text-[var(--lavender)]">{selectedModel.contextWindow.toLocaleString()} tokens</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-sm text-[var(--lavender-muted)] mb-1">Latency</p>
                  <p className="capitalize font-medium text-[var(--lavender)]">{selectedModel.latencyTier}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-sm text-[var(--lavender-muted)] mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.capabilityTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--night-lighter)]">
                <span className="text-sm text-[var(--lavender-muted)]">Status</span>
                {getStatusBadge(selectedModel.status)}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--night-lighter)]">
                <span className="text-sm text-[var(--lavender-muted)]">Cost Tier</span>
                {getCostTierBadge(selectedModel.costTier)}
              </div>
              {selectedModel.status === "deprecated" && (
                <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                  <p className="text-sm text-[var(--warning)]">
                    This model is deprecated. Please migrate to a newer version for continued support.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
