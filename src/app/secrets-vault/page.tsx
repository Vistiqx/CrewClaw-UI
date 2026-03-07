"use client";

import { useState, useEffect, useMemo } from "react";
import { Lock, Plus, Eye, Shield, Key } from "lucide-react";
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

interface Secret {
  id: string;
  assistant_id: number;
  assistant_name?: string;
  kind: string;
  provider_or_channel: string;
  purpose: string;
  environment: string;
  status: string;
  last_rotated_at: string;
}

export default function SecretsVaultPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKind, setFilterKind] = useState("all");
  const [filterEnvironment, setFilterEnvironment] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchSecrets();
  }, []);

  const fetchSecrets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/secrets");
      if (!response.ok) {
        throw new Error("Failed to fetch secrets");
      }
      const data = await response.json();
      setSecrets(data.secrets || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSecrets = useMemo(() => {
    return secrets.filter((secret) => {
      const matchesSearch =
        !searchQuery ||
        secret.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        secret.provider_or_channel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesKind = filterKind === "all" || secret.kind === filterKind;
      const matchesEnvironment = filterEnvironment === "all" || secret.environment === filterEnvironment;
      return matchesSearch && matchesKind && matchesEnvironment;
    });
  }, [secrets, searchQuery, filterKind, filterEnvironment]);

  const summaryStats = useMemo(() => {
    const total = secrets.length;
    const active = secrets.filter((s) => s.status === "active").length;
    const channelSecrets = secrets.filter((s) => s.kind === "channel").length;
    const providerSecrets = secrets.filter((s) => s.kind === "provider").length;
    return { total, active, channelSecrets, providerSecrets };
  }, [secrets]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "secondary"> = {
      active: "success",
      inactive: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getKindBadge = (kind: string) => {
    const icons: Record<string, React.ReactNode> = {
      channel: <Key className="h-3 w-3 mr-1" />,
      provider: <Shield className="h-3 w-3 mr-1" />,
      app: <Lock className="h-3 w-3 mr-1" />,
    };
    return (
      <Badge variant="secondary" className="flex items-center w-fit capitalize">
        {icons[kind]}
        {kind}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Secrets Vault" description="Manage secrets and sensitive credentials" />
        <LoadingState message="Loading secrets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Secrets Vault" description="Manage secrets and sensitive credentials" />
        <ErrorState message={error} onRetry={fetchSecrets} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Secrets Vault"
        description="Manage secrets for communication channels, providers, and applications"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Secret
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Secrets" value={summaryStats.total} subtitle="All secrets" />
        <SummaryCard title="Active Secrets" value={summaryStats.active} subtitle="Ready for use" trend="up" />
        <SummaryCard title="Channel Secrets" value={summaryStats.channelSecrets} subtitle="Communication" />
        <SummaryCard title="Provider Secrets" value={summaryStats.providerSecrets} subtitle="API access" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <FilterToolbar
            searchPlaceholder="Search secrets..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                key: "kind",
                label: "Filter by type",
                value: filterKind,
                options: [
                  { value: "all", label: "All Types" },
                  { value: "channel", label: "Channel" },
                  { value: "provider", label: "Provider" },
                  { value: "app", label: "Application" },
                ],
                onChange: setFilterKind,
              },
              {
                key: "environment",
                label: "Filter by env",
                value: filterEnvironment,
                options: [
                  { value: "all", label: "All Environments" },
                  { value: "production", label: "Production" },
                  { value: "staging", label: "Staging" },
                  { value: "development", label: "Development" },
                ],
                onChange: setFilterEnvironment,
              },
            ]}
          />
        </CardHeader>
        <CardContent>
          {filteredSecrets.length === 0 ? (
            <EmptyState
              title="No Secrets Found"
              message="No secrets match your search criteria. Try adjusting your filters or add a new secret."
              actionLabel="Add Secret"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assistant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider/Channel</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecrets.map((secret) => (
                  <TableRow key={secret.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-[var(--tropical-indigo)]" />
                        {secret.assistant_name || `Assistant ${secret.assistant_id}`}
                      </div>
                    </TableCell>
                    <TableCell>{getKindBadge(secret.kind)}</TableCell>
                    <TableCell className="capitalize text-[var(--lavender-muted)]">{secret.provider_or_channel}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{secret.purpose}</TableCell>
                    <TableCell className="capitalize text-[var(--lavender-muted)]">{secret.environment}</TableCell>
                    <TableCell>{getStatusBadge(secret.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSecret(secret);
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
            <DialogTitle>Secret Details</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-[var(--lavender-muted)]">Secret details will be shown here.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
