"use client";

import { useState, useMemo } from "react";
import { CheckCircle, X, AlertCircle, Clock, Filter, Search, FileText, Shield, Cpu, MessageSquare, Trash2, Lock, Play } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { SummaryCard } from "@/components/shared/SummaryCards";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

interface Approval {
  id: string;
  source_type: string;
  source_ref: string;
  criticality: string;
  requested_by_type: string;
  requested_by_ref: string;
  requested_by_name: string;
  status: string;
  submitted_at: string;
  decision_at?: string;
  reason: string;
  proposed_action: string;
  impacted_assets: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCriticality, setFilterCriticality] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const matchesSearch =
        !searchQuery ||
        approval.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        approval.requestedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        approval.sourceType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || approval.status === filterStatus;
      const matchesCriticality = filterCriticality === "all" || approval.criticality === filterCriticality;
      const matchesSource = filterSource === "all" || approval.sourceType === filterSource;
      const matchesTab = activeTab === "all" || approval.status === activeTab;
      return matchesSearch && matchesStatus && matchesCriticality && matchesSource && matchesTab;
    });
  }, [approvals, searchQuery, filterStatus, filterCriticality, filterSource, activeTab]);

  const summaryStats = useMemo(() => {
    const pending = approvals.filter((a) => a.status === "pending").length;
    const critical = approvals.filter((a) => a.status === "pending" && a.criticality === "critical").length;
    const high = approvals.filter((a) => a.status === "pending" && a.criticality === "high").length;
    const approvedToday = approvals.filter((a) => a.status === "approved" && a.decisionAt && new Date(a.decisionAt).toDateString() === new Date().toDateString()).length;
    const rejectedToday = approvals.filter((a) => a.status === "rejected" && a.decisionAt && new Date(a.decisionAt).toDateString() === new Date().toDateString()).length;
    return { pending, critical, high, approvedToday, rejectedToday };
  }, [approvals]);

  const handleApprove = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? { ...a, status: "approved" as const, decisionAt: new Date().toISOString() }
          : a
      )
    );
    setIsDetailOpen(false);
  };

  const handleReject = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? { ...a, status: "rejected" as const, decisionAt: new Date().toISOString() }
          : a
      )
    );
    setIsDetailOpen(false);
  };

  const getStatusBadge = (status: Approval["status"]) => {
    const variants: Record<string, "success" | "error" | "warning" | "secondary"> = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      escalated: "secondary",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getCriticalityBadge = (criticality: Approval["criticality"]) => {
    const colors: Record<string, string> = {
      low: "bg-[var(--success)]/10 text-[var(--success)]",
      medium: "bg-[var(--warning)]/10 text-[var(--warning)]",
      high: "bg-[var(--sunset-orange)]/10 text-[var(--sunset-orange)]",
      critical: "bg-[var(--error)]/10 text-[var(--error)]",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[criticality]}`}>
        {criticality.toUpperCase()}
      </span>
    );
  };

  const getSourceIcon = (sourceType: Approval["sourceType"]) => {
    switch (sourceType) {
      case "model_escalation": return <Cpu className="h-4 w-4" />;
      case "external_communication": return <MessageSquare className="h-4 w-4" />;
      case "file_deletion": return <Trash2 className="h-4 w-4" />;
      case "workflow_publish": return <Play className="h-4 w-4" />;
      case "pipeline_publish": return <CheckCircle className="h-4 w-4" />;
      case "secret_access": return <Lock className="h-4 w-4" />;
      case "tool_execution": return <Shield className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatSourceType = (sourceType: string) => {
    return sourceType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Approvals" description="Manage approval workflows and authorization requests" />
        <LoadingState message="Loading approvals..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Central owner approval center for all governance decisions"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard title="Pending Total" value={summaryStats.pending} subtitle="Awaiting decision" trend={summaryStats.pending > 0 ? "up" : "neutral"} />
        <SummaryCard title="Critical" value={summaryStats.critical} subtitle="Immediate attention" trend="down" />
        <SummaryCard title="High" value={summaryStats.high} subtitle="Priority review" />
        <SummaryCard title="Approved Today" value={summaryStats.approvedToday} subtitle="Decisions made" trend="up" />
        <SummaryCard title="Rejected Today" value={summaryStats.rejectedToday} subtitle="Decisions made" />
      </div>

      <Card className="bg-[var(--night-light)] border-[var(--border)]">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">Pending ({summaryStats.pending})</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--lavender-muted)]" />
                  <Input
                    placeholder="Search approvals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[var(--night-light)] border-[var(--border)]"
                  />
                </div>
                <Select value={filterCriticality} onValueChange={setFilterCriticality}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Criticality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="model_escalation">Model Escalation</SelectItem>
                    <SelectItem value="external_communication">External Communication</SelectItem>
                    <SelectItem value="file_deletion">File Deletion</SelectItem>
                    <SelectItem value="workflow_publish">Workflow Publish</SelectItem>
                    <SelectItem value="secret_access">Secret Access</SelectItem>
                    <SelectItem value="tool_execution">Tool Execution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApprovals.length === 0 ? (
            <EmptyState
              title="No Approvals Found"
              message="No approval requests match your search criteria. Try adjusting your filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Criticality</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-medium text-[var(--lavender)]">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(approval.sourceType)}
                        <span className="truncate max-w-[200px]">{approval.reason}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">
                      {formatSourceType(approval.sourceType)}
                    </TableCell>
                    <TableCell>{getCriticalityBadge(approval.criticality)}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{approval.requestedByName}</TableCell>
                    <TableCell className="text-[var(--lavender-muted)]">{formatDate(approval.submittedAt)}</TableCell>
                    <TableCell>{getStatusBadge(approval.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setIsDetailOpen(true);
                        }}
                      >
                        {approval.status === "pending" ? "Review" : "View"}
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
            <DialogTitle className="flex items-center gap-2">
              {selectedApproval && getSourceIcon(selectedApproval.sourceType)}
              Approval Request
            </DialogTitle>
            <DialogDescription>
              Review the details and make a decision
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--night-lighter)]">
                <div>
                  <p className="text-sm text-[var(--lavender-muted)]">Criticality</p>
                  {getCriticalityBadge(selectedApproval.criticality)}
                </div>
                <div>
                  <p className="text-sm text-[var(--lavender-muted)]">Status</p>
                  {getStatusBadge(selectedApproval.status)}
                </div>
                <div>
                  <p className="text-sm text-[var(--lavender-muted)]">Submitted</p>
                  <p className="text-[var(--lavender)]">{formatDate(selectedApproval.submittedAt)}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-sm text-[var(--lavender-muted)] mb-2">Reason</p>
                <p className="text-[var(--lavender)]">{selectedApproval.reason}</p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-sm text-[var(--lavender-muted)] mb-2">Proposed Action</p>
                <p className="text-[var(--lavender)]">{selectedApproval.proposedAction}</p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <p className="text-sm text-[var(--lavender-muted)] mb-2">Impacted Assets</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApproval.impactedAssets.map((asset) => (
                    <Badge key={asset} variant="secondary">{asset}</Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--tropical-indigo)]/20 flex items-center justify-center">
                    <span className="text-[var(--tropical-indigo)] font-medium">
                      {selectedApproval.requestedByName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--lavender-muted)]">Requested By</p>
                    <p className="font-medium text-[var(--lavender)]">{selectedApproval.requestedByName}</p>
                    <p className="text-xs text-[var(--dim-gray)] capitalize">{selectedApproval.requestedByType}</p>
                  </div>
                </div>
              </div>

              {selectedApproval.status === "pending" ? (
                <DialogFooter className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    className="bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20"
                    onClick={() => handleReject(selectedApproval.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={() => handleApprove(selectedApproval.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </DialogFooter>
              ) : (
                <div className="p-4 rounded-lg bg-[var(--night-lighter)]">
                  <p className="text-sm text-[var(--lavender-muted)]">Decision</p>
                  <p className="text-[var(--lavender)]">
                    {selectedApproval.status.charAt(0).toUpperCase() + selectedApproval.status.slice(1)} on{" "}
                    {selectedApproval.decisionAt && formatDate(selectedApproval.decisionAt)}
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
