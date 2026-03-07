"use client";

import { useState, useEffect, useMemo } from "react";
import { Route, Play, Bot, Workflow, Users, Globe } from "lucide-react";
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

interface RoutingRule {
  id: string;
  name: string;
  scope: string;
  provider: string;
  model: string;
  api_key_ref: string;
  priority: number;
  status: string;
  fallback_behavior: string;
}

export default function ModelRoutingRulesPage() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/model-routing-rules");
      if (!response.ok) {
        throw new Error("Failed to fetch routing rules");
      }
      const data = await response.json();
      setRules(data.rules || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
    const active = rules.filter((r) => r.status === "active").length;
    const total = rules.length;
    return { active, total };
  }, [rules]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "secondary" | "warning"> = {
      active: "success",
      inactive: "secondary",
      draft: "warning",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getScopeIcon = (scope: string) => {
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

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Model Routing Rules" description="Configure model selection and routing" />
        <ErrorState message={error} onRetry={fetchRules} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Active Rules" value={summaryStats.active} subtitle="In effect" trend="up" />
        <SummaryCard title="Total Rules" value={summaryStats.total} subtitle="Configured" />
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
                      <div className="text-sm">
                        <span className="capitalize text-[var(--lavender)]">{rule.provider}</span>
                        <span className="text-[var(--lavender-muted)] mx-1">/</span>
                        <span className="text-[var(--tropical-indigo)]">{rule.model}</span>
                      </div>
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
            <DialogTitle>Model Resolution Simulator</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-[var(--lavender-muted)]">Simulator functionality will be implemented soon.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
