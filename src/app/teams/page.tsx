"use client";

import { useState, useMemo } from "react";
import { UsersRound, Plus, Bot, Cpu, Key, Activity, Network } from "lucide-react";
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
import { AssistantIdentityCard } from "@/components/assistant/AssistantIdentityCard";
import { CommunicationTopology } from "@/components/graphs/CommunicationTopology";
import {
  mockTeams,
  mockAssistants,
  mockBusinesses,
  mockApiKeys,
  type Team,
} from "@/lib/mock-data/crewclaw-governance";

export default function TeamsPage() {
  const [teams] = useState<Team[]>(mockTeams);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch =
        !searchQuery ||
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.businessId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || team.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [teams, searchQuery, filterStatus]);

  const summaryStats = useMemo(() => {
    const active = teams.filter((t) => t.status === "active").length;
    const totalAssistants = teams.reduce((acc, t) => acc + t.assistantIds.length, 0);
    const activeWorkflows = teams.filter((t) => t.status === "active").length;
    const totalTasks = teams.reduce((acc, t) => acc + t.taskCount, 0);
    return { active, totalAssistants, activeWorkflows, totalTasks };
  }, [teams]);

  const getStatusBadge = (status: Team["status"]) => {
    const variants: Record<string, "success" | "secondary" | "warning"> = {
      active: "success",
      inactive: "secondary",
      draft: "warning",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getTeamAssistants = (team: Team) => {
    return mockAssistants.filter((a) => team.assistantIds.includes(a.id));
  };

  const getTeamBusiness = (team: Team) => {
    return mockBusinesses.find((b) => b.id === team.businessId);
  };

  const getAdvisorAssistant = (team: Team) => {
    return mockAssistants.find((a) => a.id === team.primaryAdvisorAssistantId);
  };

  const getOrchestratorAssistant = (team: Team) => {
    return mockAssistants.find((a) => a.id === team.orchestratorAssistantId);
  };

  const getApiKey = (team: Team) => {
    return mockApiKeys.find((k) => k.id === team.defaultApiKeyRef);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teams" description="Manage teams and team assignments" />
        <LoadingState message="Loading teams..." />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Active Teams" value={summaryStats.active} subtitle="Operational" trend="up" />
        <SummaryCard title="Assigned Assistants" value={summaryStats.totalAssistants} subtitle="Across all teams" />
        <SummaryCard title="Active Workflows" value={summaryStats.activeWorkflows} subtitle="Running" trend="up" />
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
                {filteredTeams.map((team) => {
                  const business = getTeamBusiness(team);
                  const advisor = getAdvisorAssistant(team);
                  return (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium text-[var(--lavender)]">
                        <div className="flex items-center gap-2">
                          <UsersRound className="h-4 w-4 text-[var(--tropical-indigo)]" />
                          {team.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{business?.name || team.businessId}</TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{advisor?.name || team.primaryAdvisorAssistantId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Bot className="h-4 w-4 text-[var(--dim-gray)]" />
                          <span className="text-[var(--lavender-muted)]">{team.assistantIds.length}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[var(--lavender-muted)]">{team.taskCount}</TableCell>
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
              <UsersRound className="h-5 w-5 text-[var(--tropical-indigo)]" />
              {selectedTeam?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="defaults">Defaults</TabsTrigger>
                <TabsTrigger value="topology">Topology</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Parent Business</p>
                    <p className="font-medium text-[var(--lavender)]">{getTeamBusiness(selectedTeam)?.name || selectedTeam.businessId}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Status</p>
                    {getStatusBadge(selectedTeam.status)}
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Primary Advisor</p>
                    <p className="font-medium text-[var(--lavender)]">{getAdvisorAssistant(selectedTeam)?.name || selectedTeam.primaryAdvisorAssistantId}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
                    <p className="text-xs text-[var(--lavender-muted)]">Orchestrator</p>
                    <p className="font-medium text-[var(--lavender)]">{getOrchestratorAssistant(selectedTeam)?.name || selectedTeam.orchestratorAssistantId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Bot className="h-5 w-5 text-[var(--tropical-indigo)]" />
                      <div>
                        <p className="text-2xl font-bold text-[var(--lavender)]">{selectedTeam.assistantIds.length}</p>
                        <p className="text-xs text-[var(--lavender-muted)]">Assigned Assistants</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--night-lighter)] border-[var(--border)]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Activity className="h-5 w-5 text-[var(--success)]" />
                      <div>
                        <p className="text-2xl font-bold text-[var(--lavender)]">{selectedTeam.taskCount}</p>
                        <p className="text-xs text-[var(--lavender-muted)]">Active Tasks</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4 mt-4">
                <div className="grid gap-3">
                  {getTeamAssistants(selectedTeam).map((assistant) => (
                    <AssistantIdentityCard
                      key={assistant.id}
                      assistant={assistant}
                      businesses={mockBusinesses}
                      compact
                    />
                  ))}
                </div>
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
                      <p className="capitalize font-medium text-[var(--lavender)]">{selectedTeam.defaultProvider}</p>
                    </div>
                    <div className="p-3 rounded bg-[var(--night-light)]">
                      <p className="text-xs text-[var(--lavender-muted)]">Default Model</p>
                      <p className="font-medium text-[var(--lavender)]">{selectedTeam.defaultModel}</p>
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
                    <p className="font-mono text-sm text-[var(--lavender)]">{selectedTeam.defaultApiKeyRef}</p>
                    <p className="text-xs text-[var(--dim-gray)] mt-1">
                      {getApiKey(selectedTeam)?.name || "Key details not available"}
                    </p>
                  </div>
                </div>

                {selectedTeam.policyPackId && (
                  <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                    <h4 className="text-sm font-medium text-[var(--lavender)] mb-2">Policy Pack</h4>
                    <Badge variant="secondary">{selectedTeam.policyPackId}</Badge>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="topology" className="space-y-4 mt-4">
                <CommunicationTopology
                  councils={[]}
                  teams={[{ id: selectedTeam.id, name: selectedTeam.name }]}
                  assistants={getTeamAssistants(selectedTeam).map((a) => ({
                    id: a.id,
                    name: a.name,
                    type: a.id === selectedTeam.primaryAdvisorAssistantId ? "advisor" : "worker",
                  }))}
                  allowedEdges={[
                    { from: "owner", to: selectedTeam.primaryAdvisorAssistantId },
                    ...selectedTeam.assistantIds.map((id) => ({ from: selectedTeam.primaryAdvisorAssistantId, to: id })),
                  ]}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <UsersRound className="h-12 w-12 text-[var(--tropical-indigo)] mx-auto mb-4" />
            <p className="text-[var(--lavender)] mb-2">Team Creation</p>
            <p className="text-sm text-[var(--lavender-muted)]">
              This would open a form to create a new team with name, business, and initial members.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
