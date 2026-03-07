"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Plus, Users2, UserCheck, FileText, AlertCircle } from "lucide-react";
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

interface Council {
  id: string;
  name: string;
  domain: string;
  primary_business_id: string;
  business_name?: string;
  status: string;
  lead_assistant_id: number | null;
  lead_assistant_name?: string;
  description: string;
  member_count: number;
  recent_recommendations: number;
  pending_approvals: number;
  members?: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  subsidiaries?: string[];
}

export default function CouncilsPage() {
  const [councils, setCouncils] = useState<Council[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchCouncils();
  }, []);

  const fetchCouncils = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/councils");
      if (!response.ok) {
        throw new Error("Failed to fetch councils");
      }
      const data = await response.json();
      setCouncils(data.councils || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCouncils = useMemo(() => {
    return councils.filter((council) => {
      const matchesSearch =
        !searchQuery ||
        council.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        council.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || council.status === filterStatus;
      const matchesDomain = filterDomain === "all" || council.domain === filterDomain;
      return matchesSearch && matchesStatus && matchesDomain;
    });
  }, [councils, searchQuery, filterStatus, filterDomain]);

  const domains = useMemo(() => {
    return Array.from(new Set(councils.map((c) => c.domain)));
  }, [councils]);

  const summaryStats = useMemo(() => {
    const active = councils.filter((c) => c.status === "active").length;
    const totalMembers = councils.reduce((acc, c) => acc + (c.member_count || 0), 0);
    const openRecommendations = councils.reduce((acc, c) => acc + (c.recent_recommendations || 0), 0);
    const pendingApprovals = councils.reduce((acc, c) => acc + (c.pending_approvals || 0), 0);
    return { active, totalMembers, openRecommendations, pendingApprovals };
  }, [councils]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "secondary" | "warning"> = {
      active: "success",
      inactive: "secondary",
      draft: "warning",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Councils" description="Manage organizational councils and governing bodies" />
        <LoadingState message="Loading councils..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Councils" description="Manage organizational councils and governing bodies" />
        <ErrorState message={error} onRetry={fetchCouncils} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Councils"
        description="Advisory councils for strategic governance and decision-making"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Council
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Active Councils" value={summaryStats.active} subtitle="Operational" trend="up" />
        <SummaryCard title="Total Members" value={summaryStats.totalMembers} subtitle="Across all councils" />
        <SummaryCard title="Recommendations" value={summaryStats.openRecommendations} subtitle="Recent activity" />
        <SummaryCard title="Pending Approvals" value={summaryStats.pendingApprovals} subtitle="Awaiting decision" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <FilterToolbar
            searchPlaceholder="Search councils..."
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
                key: "domain",
                label: "Filter by domain",
                value: filterDomain,
                options: [
                  { value: "all", label: "All Domains" },
                  ...domains.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })),
                ],
                onChange: setFilterDomain,
              },
            ]}
          />
        </CardHeader>
        <CardContent>
          {filteredCouncils.length === 0 ? (
            <EmptyState
              title="No Councils Found"
              message="No councils match your search criteria. Try adjusting your filters or create a new council."
              actionLabel="Create Council"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Primary Company</TableHead>
                  <TableHead>Lead Advisor</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouncils.map((council) => (
                  <TableRow key={council.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--tropical-indigo)]" />
                        {council.name}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-[var(--lavender-muted)]">{council.domain}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{council.business_name || council.primary_business_id}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">
                      {council.lead_assistant_name || "Not assigned"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users2 className="h-4 w-4 text-[var(--dim-gray)]" />
                        <span className="text-[var(--lavender-muted)]">{council.member_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(council.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCouncil(council);
                          setIsDetailOpen(true);
                        }}
                      >
                        View Details
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--tropical-indigo)]" />
              {selectedCouncil?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCouncil && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                  <h4 className="text-sm font-medium text-[var(--lavender)] mb-2">Mission</h4>
                  <p className="text-[var(--lavender-muted)]">{selectedCouncil.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Domain</p>
                    <p className="capitalize font-medium text-[var(--lavender)]">{selectedCouncil.domain}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Primary Company</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedCouncil.business_name || selectedCouncil.primary_business_id}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Status</p>
                    {getStatusBadge(selectedCouncil.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Members</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedCouncil.member_count || 0} assistants</p>
                  </div>
                </div>

                {selectedCouncil.subsidiaries && selectedCouncil.subsidiaries.length > 0 && (
                  <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                    <h4 className="text-sm font-medium text-[var(--lavender)] mb-2">Participating Subsidiaries</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCouncil.subsidiaries.map((bizName) => (
                        <Badge key={bizName} variant="secondary">{bizName}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-[var(--night-lighter)] mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[var(--tropical-indigo)]" />
                    <span className="text-sm text-[var(--lavender-muted)]">
                      Lead Advisor: <span className="text-[var(--lavender)]">{selectedCouncil.lead_assistant_name || "Not assigned"}</span>
                    </span>
                  </div>
                </div>
                {selectedCouncil.members && selectedCouncil.members.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCouncil.members.map((member) => (
                      <div key={member.id} className="p-3 rounded-lg bg-[var(--night-lighter)] flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--tropical-indigo)]/20 flex items-center justify-center">
                          <Users className="h-4 w-4 text-[var(--tropical-indigo)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--lavender)]">{member.name}</p>
                        </div>
                        <Badge variant={member.status === 'running' ? 'success' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Members"
                    message="This council has no assigned assistants yet."
                  />
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[var(--info)]" />
                      <div>
                        <p className="text-2xl font-bold text-[var(--lavender)]">{selectedCouncil.recent_recommendations || 0}</p>
                        <p className="text-xs text-[var(--lavender-muted)]">Recent Recommendations</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-[var(--warning)]" />
                      <div>
                        <p className="text-2xl font-bold text-[var(--lavender)]">{selectedCouncil.pending_approvals || 0}</p>
                        <p className="text-xs text-[var(--lavender-muted)]">Pending Approvals</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Council</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-[var(--tropical-indigo)] mx-auto mb-4" />
            <p className="text-[var(--lavender)] mb-2">Council Creation</p>
            <p className="text-sm text-[var(--lavender-muted)]">
              Create council functionality will be available soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
