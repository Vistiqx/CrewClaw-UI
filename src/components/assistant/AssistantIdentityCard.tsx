"use client";

import { Bot, Building2, Users, Activity, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Assistant } from "@/lib/mock-data/crewclaw-governance";

interface AssistantIdentityCardProps {
  assistant: Assistant;
  businesses?: { id: string; name: string }[];
  teams?: { id: string; name: string }[];
  councils?: { id: string; name: string }[];
  compact?: boolean;
}

export function AssistantIdentityCard({
  assistant,
  businesses = [],
  teams = [],
  councils = [],
  compact = false,
}: AssistantIdentityCardProps) {
  const business = businesses.find(b => b.id === assistant.businessId);
  const team = teams.find(t => t.id === assistant.teamId);
  const assistantCouncils = councils.filter(c => assistant.councilIds.includes(c.id));

  const operatingModeLabels: Record<string, string> = {
    observe: "Observe Only",
    propose: "Propose Only",
    execute_with_approval: "Execute with Approval",
    autonomous: "Autonomous",
  };

  const statusColors: Record<string, "success" | "error" | "secondary"> = {
    running: "success",
    stopped: "secondary",
    error: "error",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--night-lighter)]">
        <div className="h-10 w-10 rounded-full bg-[var(--tropical-indigo)]/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-[var(--tropical-indigo)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--lavender)] truncate">{assistant.name}</p>
          <p className="text-xs text-[var(--lavender-muted)]">{business?.name || assistant.businessId}</p>
        </div>
        <Badge variant={statusColors[assistant.status]} className="text-xs">
          {assistant.status}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="bg-[var(--night-light)] border-[var(--border)]">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[var(--tropical-indigo)]/20 flex items-center justify-center">
              <Bot className="h-6 w-6 text-[var(--tropical-indigo)]" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--lavender)]">{assistant.name}</h4>
              <p className="text-sm text-[var(--lavender-muted)]">{assistant.description}</p>
            </div>
          </div>
          <Badge variant={statusColors[assistant.status]}>
            {assistant.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-[var(--lavender-muted)]">
            <Building2 className="h-4 w-4" />
            <span>{business?.name || assistant.businessId}</span>
          </div>
          {team && (
            <div className="flex items-center gap-2 text-[var(--lavender-muted)]">
              <Users className="h-4 w-4" />
              <span>{team.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[var(--lavender-muted)]">
            <Activity className="h-4 w-4" />
            <span>{operatingModeLabels[assistant.operatingMode]}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--lavender-muted)]">
            <AlertCircle className="h-4 w-4" />
            <span>{assistant.recentRuns} runs, {assistant.recentApprovals} approvals</span>
          </div>
        </div>

        {assistantCouncils.length > 0 && (
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--lavender-muted)] mb-2">Councils</p>
            <div className="flex flex-wrap gap-1">
              {assistantCouncils.map(council => (
                <Badge key={council.id} variant="secondary" className="text-xs">
                  {council.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
