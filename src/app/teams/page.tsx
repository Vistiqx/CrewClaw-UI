"use client";

import { useState, useEffect, useMemo } from "react";
import { UsersRound, Plus, Bot, Cpu, Key, Activity } from "lucide-react";
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
import { ErrorState } from "@/components/shared/ErrorState";

interface Team {
  id: string;
  name: string;
  business_id: string;
  business_name?: string;
  primary_advisor_assistant_id: number | null;
  orchestrator_assistant_id: number | null;
  advisor_name?: string;
  orchestrator_name?: string;
  status: string;
  default_provider: string;
  default_model: string;
  default_api_key_ref: string;
  policy_pack_id: string | null;
  task_count: number;
  member_count: number;
  members?: Array<{
    id: number;
    name: string;
    status: string;
  }>;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      setTeams(data.teams || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch =
        !searchQuery ||
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || team.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [teams, searchQuery, filterStatus]);

  const summaryStats = useMemo(() => {
    const active = teams.filter((t) => t.status === "active").length;
    const totalAssistants = teams.reduce((acc, t) => acc + (t.member_count || 0), 0);
    const totalTasks = teams.reduce((acc, t) => acc + (t.task_count || 0), 0);
    return { active, totalAssistants, totalTasks };
  }, [teams]);

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
        <PageHeader title="Teams" description="Manage teams and team assignments" />
        <LoadingState message="Loading teams..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teams" description="Manage teams and team assignments" />
        <ErrorState message={error} onRetry={fetchTeams} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Subsidiary execution groups with advisors and orchestrators"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard title="Active Teams" value={summaryStats.active} subtitle="Operational" trend="up" />
        <SummaryCard title="Assigned Assistants" value={summaryStats.totalAssistants} subtitle="Across all teams" />
        <SummaryCard title="Total Tasks" value={summaryStats.totalTasks} subtitle="In progress" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <FilterToolbar
            searchPlaceholder="Search teams..."
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
            ]}
          />
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <EmptyState
              title="No Teams Found"
              message="No teams match your search criteria. Try adjusting your filters or create a new team."
              actionLabel="Create Team"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent Business</TableHead>
                  <TableHead>Primary Advisor</TableHead>
                  <TableHead>Assistants</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-[var(--tropical-indigo)]" />
                        {team.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{team.business_name || team.business_id}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">
                      {team.advisor_name || "Not assigned"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Bot className="h-4 w-4 text-[var(--dim-gray)]" />
                        <span className="text-[var(--lavender-muted)]">{team.member_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{team.task_count || 0}</TableCell>
                    <TableCell>{getStatusBadge(team.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTeam(team);
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
              <UsersRound className="h-5 w-5 text-[var(--tropical-indigo)]" />
              {selectedTeam?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="defaults">Defaults</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Parent Business</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedTeam.business_name || selectedTeam.business_id}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Status</p>
                    {getStatusBadge(selectedTeam.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Primary Advisor</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedTeam.advisor_name || "Not assigned"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Orchestrator</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedTeam.orchestrator_name || "Not assigned"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Bot className="h-5 w-5 text-[var(--tropical-indigo)]" />
                      <div>
                        <p className="text-2xl font-bold text-[var(--lavender)]">{selectedTeam.member_count || 0}</p>
                        <p className="text-xs text-[var(--lavender-muted)]">Assigned Assistants</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Activity className="h-5 w-5 text-[var(--success)]" />
                      <div>
                        <p className="text-2xl font-bold text-[var(--lavender)]">{selectedTeam.task_count || 0}</p>
                        <p className="text-xs text-[var(--lavender-muted)]">Active Tasks</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4 mt-4">
                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTeam.members.map((member) => (
                      <div key={member.id} className="p-3 rounded-lg bg-[var(--night-lighter)] flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--tropical-indigo)]/20 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-[var(--tropical-indigo)]" />
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
                    message="This team has no assigned assistants yet."
                  />
                )}
              </TabsContent>

              <TabsContent value="defaults" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                  <h4 className="text-sm font-medium text-[var(--lavender)] mb-4 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[var(--tropical-indigo)]" />
                    Default Model Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded bg-[var(--night-light)]">
                      <p className="text-xs text-[var(--lavender-muted)]">Default Provider</p>
                      <p className="capitalize font-medium text-[var(--lavender)]">{selectedTeam.default_provider || "Not set"}</p>
                    </div>
                    <div className="p-3 rounded bg-[var(--night-light)]">
                      <p className="text-xs text-[var(--lavender-muted)]">Default Model</p>
                      <p className="font-medium text-[var(--lavender)]">{selectedTeam.default_model || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                  <h4 className="text-sm font-medium text-[var(--lavender)] mb-4 flex items-center gap-2">
                    <Key className="h-4 w-4 text-[var(--tropical-indigo)]" />
                    Default API Key
                  </h4>
                  <div className="p-3 rounded bg-[var(--night-light)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Key Reference</p>
                    <p className="font-mono text-sm text-[var(--lavender)]">{selectedTeam.default_api_key_ref || "Not set"}</p>
                  </div>
                </div>

                {selectedTeam.policy_pack_id && (
                  <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                    <h4 className="text-sm font-medium text-[var(--lavender)] mb-2">Policy Pack</h4>
                    <Badge variant="secondary">{selectedTeam.policy_pack_id}</Badge>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <UsersRound className="h-12 w-12 text-[var(--tropical-indigo)] mx-auto mb-4" />
            <p className="text-[var(--lavender)] mb-2">Team Creation</p>
            <p className="text-sm text-[var(--lavender-muted)]">
              Create team functionality will be available soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
