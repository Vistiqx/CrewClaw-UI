"use client";

import { useState, useMemo } from "react";
import { Users, Plus, Users2, UserCheck, FileText, AlertCircle, CheckCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { SummaryCard, FilterToolbar } from "@/components/shared/SummaryCards";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { AssistantIdentityCard } from "@/components/assistant/AssistantIdentityCard";
import {
  mockCouncils,
  mockAssistants,
  mockBusinesses,
  type Council,
} from "@/lib/mock-data/crewclaw-governance";

export default function CouncilsPage() {
  const [councils] = useState<Council[]>(mockCouncils);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [isLoading] = useState(false);
  const [selectedCouncil, setSelectedCouncil] = useState<Council | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const summaryStats = useMemo(() => {
    const active = councils.filter((c) => c.status === "active").length;
    const totalMembers = councils.reduce((acc, c) => acc + c.memberIds.length, 0);
    const openRecommendations = councils.reduce((acc, c) => acc + c.recentRecommendations, 0);
    const pendingApprovals = councils.reduce((acc, c) => acc + c.pendingApprovals, 0);
    return { active, totalMembers, openRecommendations, pendingApprovals };
  }, [councils]);

  const domains = Array.from(new Set(councils.map((c) => c.domain)));

  const getStatusBadge = (status: Council["status"]) => {
    const variants: Record<string, "success" | "secondary" | "warning"> = {
      active: "success",
      inactive: "secondary",
      draft: "warning",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getCouncilAssistants = (council: Council) => {
    return mockAssistants.filter((a) => council.memberIds.includes(a.id));
  };

  const getCouncilBusiness = (council: Council) => {
    return mockBusinesses.find((b) => b.id === council.primaryBusinessId);
  };

  const getLeadAssistant = (council: Council) => {
    if (!council.leadAssistantId || council.leadAssistantId === 'unassigned') return null;
    return mockAssistants.find((a) => a.id === council.leadAssistantId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Councils" description="Manage organizational councils and governing bodies" />
        <LoadingState message="Loading councils..." />
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
        <SummaryCard
          title="Pending Approvals"
          value={summaryStats.pendingApprovals}
          subtitle="Awaiting decision"
          trend={summaryStats.pendingApprovals > 0 ? "up" : "neutral"}
        />
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
                {filteredCouncils.map((council) => {
                  const business = getCouncilBusiness(council);
                  const leadAssistant = getLeadAssistant(council);
                  return (
                    <TableRow key={council.id}>
                      <TableCell className="font-medium text-[var(--lavender)]">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--tropical-indigo)]" />
                          {council.name}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-[var(--lavender-muted)]">{council.domain}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{business?.name || council.primaryBusinessId}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">
                        {leadAssistant?.name || 
                         (council.leadAssistantId && council.leadAssistantId !== 'unassigned' 
                           ? council.leadAssistantId 
                           : <span className="text-[var(--dim-gray)] italic">Not assigned</span>)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users2 className="h-4 w-4 text-[var(--dim-gray)]" />
                          <span className="text-[var(--lavender-muted)]">{council.memberIds.length}</span>
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
                  );
                })}
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
                    <p className="font-medium text-[var(--lavender)]">
                      {getCouncilBusiness(selectedCouncil)?.name || selectedCouncil.primaryBusinessId}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Status</p>
                    {getStatusBadge(selectedCouncil.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Members</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedCouncil.memberIds.length} assistants</p>
                  </div>
                </div>

                {selectedCouncil.subsidiaryBusinessIds.length > 0 && (
                  <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                    <h4 className="text-sm font-medium text-[var(--lavender)] mb-2">Participating Subsidiaries</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCouncil.subsidiaryBusinessIds.map((bizId) => {
                        const biz = mockBusinesses.find((b) => b.id === bizId);
                        return (
                          <Badge key={bizId} variant="secondary">
                            {biz?.name || bizId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-[var(--night-lighter)] mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[var(--tropical-indigo)]" />
                    <span className="text-sm text-[var(--lavender-muted)]">
                      Lead Advisor: <span className="text-[var(--lavender)]">
                        {getLeadAssistant(selectedCouncil)?.name || 
                         (selectedCouncil.leadAssistantId && selectedCouncil.leadAssistantId !== 'unassigned' 
                           ? selectedCouncil.leadAssistantId 
                           : <span className="text-[var(--dim-gray)] italic">Not assigned</span>)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="grid gap-3">
                  {getCouncilAssistants(selectedCouncil).map((assistant) => (
                    <AssistantIdentityCard
                      key={assistant.id}
                      assistant={assistant}
                      businesses={mockBusinesses}
                      compact
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[var(--info)]" />
                      <div>
                        <p className="text-2xl font-bold text-[var(--lavender)]">{selectedCouncil.recentRecommendations}</p>
                        <p className="text-xs text-[var(--lavender-muted)]">Recent Recommendations</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-[var(--warning)]" />
                      <div>
                        <p className="text-2xl font-bold text-[var(--lavender)]">{selectedCouncil.pendingApprovals}</p>
                        <p className="text-xs text-[var(--lavender-muted)]">Pending Approvals</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                  <h4 className="text-sm font-medium text-[var(--lavender)] mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-[var(--success)] mt-0.5" />
                      <div>
                        <p className="text-[var(--lavender)]">Recommendation approved: Q1 budget allocation</p>
                        <p className="text-xs text-[var(--dim-gray)]">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <Users className="h-4 w-4 text-[var(--tropical-indigo)] mt-0.5" />
                      <div>
                        <p className="text-[var(--lavender)]">New member joined: ACME-Security-Analyst</p>
                        <p className="text-xs text-[var(--dim-gray)]">5 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <FileText className="h-4 w-4 text-[var(--info)] mt-0.5" />
                      <div>
                        <p className="text-[var(--lavender)]">New recommendation submitted: Risk assessment</p>
                        <p className="text-xs text-[var(--dim-gray)]">1 week ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Council</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Council Name *</label>
              <Input placeholder="e.g., Finance Council" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Domain *</label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="strategy">Strategy</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Primary Company *</label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary company" />
                </SelectTrigger>
                <SelectContent>
                  {mockBusinesses.filter(b => b.type === 'primary').map((biz) => (
                    <SelectItem key={biz.id} value={biz.id}>{biz.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-[var(--lavender-muted)]">Description</label>
              <Input placeholder="Council mission and responsibilities" />
            </div>
            
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm font-medium text-[var(--lavender)] mb-3">Leadership (Optional)</p>
              <p className="text-xs text-[var(--lavender-muted)] mb-4">
                You can assign a lead advisor now or leave unassigned and add them later.
              </p>
              
              <div className="space-y-2">
                <label className="text-sm text-[var(--lavender-muted)]">Lead Advisor</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Not assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Not assigned</SelectItem>
                    {mockAssistants.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm font-medium text-[var(--lavender)] mb-3">Member Companies (Optional)</p>
              <p className="text-xs text-[var(--lavender-muted)] mb-4">
                Select subsidiary companies that can participate in this council.
              </p>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockBusinesses.filter(b => b.type === 'subsidiary').map((biz) => (
                  <label key={biz.id} className="flex items-center gap-2 p-2 rounded bg-[var(--night-lighter)] cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-[var(--lavender)]">{biz.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Council
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
