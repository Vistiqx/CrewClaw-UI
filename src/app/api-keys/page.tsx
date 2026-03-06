"use client";

import { useState, useMemo } from "react";
import { Key, Eye, EyeOff, RotateCw, CheckCircle, AlertTriangle, XCircle, Trash2, Edit2 } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { SummaryCard, FilterToolbar } from "@/components/shared/SummaryCards";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { mockApiKeys, type ApiKey } from "@/lib/mock-data/crewclaw-governance";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);

  const filteredKeys = useMemo(() => {
    return apiKeys.filter((key) => {
      const matchesSearch =
        !searchQuery ||
        key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.provider.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || key.status === filterStatus;
      const matchesProvider = filterProvider === "all" || key.provider === filterProvider;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [apiKeys, searchQuery, filterStatus, filterProvider]);

  const summaryStats = useMemo(() => {
    const total = apiKeys.length;
    const active = apiKeys.filter((k) => k.status === "active").length;
    const expiringSoon = apiKeys.filter((k) => {
      const lastRotated = new Date(k.lastRotatedAt);
      const daysSinceRotation = (Date.now() - lastRotated.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceRotation > 80;
    }).length;
    const providers = new Set(apiKeys.map((k) => k.provider)).size;
    return { total, active, expiringSoon, providers };
  }, [apiKeys]);

  const handleRotateKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((k) =>
        k.id === keyId
          ? { ...k, lastRotatedAt: new Date().toISOString(), status: "active" as const }
          : k
      )
    );
    setIsRotateDialogOpen(false);
    setSelectedKey(null);
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const handleCreateKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: formData.get("name") as string,
      provider: formData.get("provider") as string,
      scope: formData.get("scope") as ApiKey["scope"],
      environment: formData.get("environment") as ApiKey["environment"],
      status: "active",
      lastRotatedAt: new Date().toISOString(),
      assignedAssistants: 0,
      health: "healthy",
    };
    setApiKeys((prev) => [...prev, newKey]);
    setIsCreateDialogOpen(false);
  };

  const getStatusBadge = (status: ApiKey["status"]) => {
    const variants: Record<string, "success" | "secondary" | "error" | "warning"> = {
      active: "success",
      inactive: "secondary",
      expired: "error",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getHealthBadge = (health: ApiKey["health"]) => {
    const variants: Record<string, "success" | "warning" | "error"> = {
      healthy: "success",
      warning: "warning",
      error: "error",
    };
    const icons = {
      healthy: <CheckCircle className="h-3 w-3 mr-1" />,
      warning: <AlertTriangle className="h-3 w-3 mr-1" />,
      error: <XCircle className="h-3 w-3 mr-1" />,
    };
    return (
      <Badge variant={variants[health]} className="flex items-center">
        {icons[health]}
        {health}
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

  const providers = Array.from(new Set(apiKeys.map((k) => k.provider)));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="API Keys" description="Manage API keys and authentication tokens for model providers" />
        <LoadingState message="Loading API keys..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="API Keys" description="Manage API keys and authentication tokens for model providers" />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Manage API keys and authentication tokens for model providers"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Keys" value={summaryStats.total} subtitle="All API keys" />
        <SummaryCard title="Active Keys" value={summaryStats.active} subtitle="Ready for use" trend="up" trendValue="Operational" />
        <SummaryCard
          title="Expiring Soon"
          value={summaryStats.expiringSoon}
          subtitle="Rotation recommended"
          trend={summaryStats.expiringSoon > 0 ? "down" : "neutral"}
        />
        <SummaryCard title="Providers" value={summaryStats.providers} subtitle="Unique providers" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <FilterToolbar
            searchPlaceholder="Search API keys..."
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
                  { value: "expired", label: "Expired" },
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
            actionLabel="Add API Key"
            onAction={() => setIsCreateDialogOpen(true)}
          />
        </CardHeader>
        <CardContent>
          {filteredKeys.length === 0 ? (
            <EmptyState
              title="No API Keys Found"
              message="No API keys match your search criteria. Try adjusting your filters or add a new key."
              actionLabel="Add API Key"
              onAction={() => setIsCreateDialogOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Last Rotated</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-[var(--tropical-indigo)]" />
                        {key.name}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-[var(--lavender-muted)]">{key.provider}</TableCell>
                    <TableCell className="capitalize text-[var(--lavender-muted)]">{key.scope}</TableCell>
                    <TableCell className="capitalize text-[var(--lavender-muted)]">{key.environment}</TableCell>
                    <TableCell>{getStatusBadge(key.status)}</TableCell>
                    <TableCell>{getHealthBadge(key.health)}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{formatDate(key.lastRotatedAt)}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{key.assignedAssistants} assistants</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedKey(key);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedKey(key);
                            setIsRotateDialogOpen(true);
                          }}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-[var(--error)] hover:text-[var(--error)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
            <DialogDescription>Create a new API key for model provider access</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateKey}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Key Name</label>
                <Input name="name" placeholder="e.g., OpenAI Production Key" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Provider</label>
                <Select name="provider" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="azure">Azure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Scope</label>
                <Select name="scope" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Environment</label>
                <Select name="environment" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Key</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to rotate "{selectedKey?.name}"? This will invalidate the current key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsRotateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedKey && handleRotateKey(selectedKey.id)}>
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
