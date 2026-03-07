"use client";

import { useState, useMemo } from "react";
import { Lock, Plus, Eye, Shield, Key, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
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
  mockSecrets,
  mockAssistants,
  mockApiKeys,
  type SecretReference,
} from "@/lib/mock-data/crewclaw-governance";

export default function SecretsVaultPage() {
  const [secrets] = useState<SecretReference[]>(mockSecrets);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKind, setFilterKind] = useState("all");
  const [filterEnvironment, setFilterEnvironment] = useState("all");
  const [isLoading] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<SecretReference | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredSecrets = useMemo(() => {
    return secrets.filter((secret) => {
      const matchesSearch =
        !searchQuery ||
        secret.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        secret.providerOrChannel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mockAssistants.find((a) => a.id === secret.assistantId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
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

  const getStatusBadge = (status: SecretReference["status"]) => {
    const variants: Record<string, "success" | "secondary"> = {
      active: "success",
      inactive: "secondary",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getKindBadge = (kind: SecretReference["kind"]) => {
    const icons = {
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

  const getAssistant = (secret: SecretReference) => {
    return mockAssistants.find((a) => a.id === secret.assistantId);
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
            actionLabel="Add Secret"
            onAction={() => setIsCreateOpen(true)}
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
                  <TableHead>Last Rotated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecrets.map((secret) => {
                  const assistant = getAssistant(secret);
                  return (
                    <TableRow key={secret.id}>
                      <TableCell className="font-medium text-[var(--lavender)]">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-[var(--tropical-indigo)]" />
                          {assistant?.name || secret.assistantId}
                        </div>
                      </TableCell>
                      <TableCell>{getKindBadge(secret.kind)}</TableCell>
                      <TableCell className="capitalize text-[var(--lavender-muted)]">{secret.providerOrChannel}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{secret.purpose}</TableCell>
                      <TableCell className="capitalize text-[var(--lavender-muted)]">{secret.environment}</TableCell>
                      <TableCell>{getStatusBadge(secret.status)}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{formatDate(secret.lastRotatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                          <Button size="sm" variant="ghost">
                            <RefreshCw className="h-4 w-4" />
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

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--tropical-indigo)]" />
            Secret Usage Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assistant</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Providers</TableHead>
                  <TableHead>Apps</TableHead>
                  <TableHead>Total Secrets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssistants.map((assistant) => {
                  const assistantSecrets = secrets.filter((s) => s.assistantId === assistant.id);
                  const channelCount = assistantSecrets.filter((s) => s.kind === "channel").length;
                  const providerCount = assistantSecrets.filter((s) => s.kind === "provider").length;
                  const appCount = assistantSecrets.filter((s) => s.kind === "app").length;
                  
                  return (
                    <TableRow key={assistant.id}>
                      <TableCell className="font-medium text-[var(--lavender)]">{assistant.name}</TableCell>
                      <TableCell>
                        {channelCount > 0 ? (
                          <Badge variant="secondary">{channelCount}</Badge>
                        ) : (
                          <span className="text-[var(--dim-gray)]">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {providerCount > 0 ? (
                          <Badge variant="secondary">{providerCount}</Badge>
                        ) : (
                          <span className="text-[var(--dim-gray)]">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {appCount > 0 ? (
                          <Badge variant="secondary">{appCount}</Badge>
                        ) : (
                          <span className="text-[var(--dim-gray)]">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[var(--tropical-indigo)]" />
                          <span className="font-medium">{assistantSecrets.length}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[var(--tropical-indigo)]" />
              Secret Details
            </DialogTitle>
          </DialogHeader>
          {selectedSecret && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-xs text-[var(--lavender-muted)] mb-1">Assistant</p>
                <p className="font-medium text-[var(--lavender)]">{getAssistant(selectedSecret)?.name || selectedSecret.assistantId}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-xs text-[var(--lavender-muted)]">Type</p>
                  {getKindBadge(selectedSecret.kind)}
                </div>
                <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-xs text-[var(--lavender-muted)]">Environment</p>
                  <p className="capitalize text-[var(--lavender)]">{selectedSecret.environment}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-xs text-[var(--lavender-muted)] mb-1">Provider/Channel</p>
                <p className="capitalize font-medium text-[var(--lavender)]">{selectedSecret.providerOrChannel}</p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-xs text-[var(--lavender-muted)] mb-1">Purpose</p>
                <p className="text-[var(--lavender)]">{selectedSecret.purpose}</p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-xs text-[var(--lavender-muted)] mb-1">Secret Reference</p>
                <p className="font-mono text-sm text-[var(--dim-gray)]">{selectedSecret.id}</p>
                <p className="text-xs text-[var(--lavender-muted)] mt-2">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Actual secret values are encrypted and not displayed
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-xs text-[var(--lavender-muted)]">Last Rotated</p>
                  <p className="text-[var(--lavender)]">{formatDate(selectedSecret.lastRotatedAt)}</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-xs text-[var(--lavender-muted)]">Status</p>
                  {getStatusBadge(selectedSecret.status)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Secret</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <Lock className="h-12 w-12 text-[var(--tropical-indigo)] mx-auto mb-4" />
            <p className="text-[var(--lavender)] mb-2">Add New Secret</p>
            <p className="text-sm text-[var(--lavender-muted)]">
              This would open a form to create a new secret reference with assistant binding.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
