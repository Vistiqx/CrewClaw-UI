"use client";

import { Cpu, Key, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface RuntimePreviewProps {
  provider: string;
  model: string;
  apiKeyRef: string;
  sourceOfDecision: string;
  allowlistStatus: 'allowed' | 'blocked' | 'pending';
  blockedReason?: string;
  requiresApproval?: boolean;
  approvalReason?: string;
}

export function RuntimePreview({
  provider,
  model,
  apiKeyRef,
  sourceOfDecision,
  allowlistStatus,
  blockedReason,
  requiresApproval,
  approvalReason,
}: RuntimePreviewProps) {
  const sourceLabels: Record<string, string> = {
    assistant_override: "Assistant Override",
    workflow_step_rule: "Workflow Step Rule",
    team_default: "Team Default",
    global_default: "Global Default",
  };

  const statusConfig = {
    allowed: { icon: CheckCircle, color: "text-[var(--success)]", bgColor: "bg-[var(--success)]/10", label: "Allowlisted" },
    blocked: { icon: XCircle, color: "text-[var(--error)]", bgColor: "bg-[var(--error)]/10", label: "Blocked" },
    pending: { icon: AlertTriangle, color: "text-[var(--warning)]", bgColor: "bg-[var(--warning)]/10", label: "Pending Review" },
  };

  const status = statusConfig[allowlistStatus];
  const StatusIcon = status.icon;

  return (
    <Card className="bg-[var(--night-light)] border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[var(--tropical-indigo)]" />
            <CardTitle className="text-base">Resolved Runtime</CardTitle>
          </div>
          <Badge variant={allowlistStatus === 'allowed' ? 'success' : allowlistStatus === 'blocked' ? 'error' : 'warning'}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
            <p className="text-xs text-[var(--lavender-muted)] mb-1">Provider</p>
            <p className="font-medium text-[var(--lavender)] capitalize">{provider}</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
            <p className="text-xs text-[var(--lavender-muted)] mb-1">Model</p>
            <p className="font-medium text-[var(--lavender)]">{model}</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--night-lighter)] flex items-center gap-3">
          <Key className="h-4 w-4 text-[var(--lavender-muted)]" />
          <div>
            <p className="text-xs text-[var(--lavender-muted)]">API Key Reference</p>
            <p className="font-mono text-sm text-[var(--lavender)]">{apiKeyRef}</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--night-lighter)]">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-[var(--tropical-indigo)]" />
            <p className="text-sm font-medium text-[var(--lavender)]">Decision Source</p>
          </div>
          <p className="text-sm text-[var(--lavender-muted)]">{sourceLabels[sourceOfDecision] || sourceOfDecision}</p>
        </div>

        <div className={`p-3 rounded-lg ${status.bgColor} flex items-start gap-3`}>
          <StatusIcon className={`h-5 w-5 ${status.color} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`font-medium ${status.color}`}>
              {allowlistStatus === 'allowed' ? 'Ready to Execute' : allowlistStatus === 'blocked' ? 'Execution Blocked' : 'Pending Approval'}
            </p>
            {blockedReason && (
              <p className="text-sm text-[var(--lavender-muted)] mt-1">{blockedReason}</p>
            )}
            {requiresApproval && approvalReason && (
              <p className="text-sm text-[var(--lavender-muted)] mt-1">{approvalReason}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
