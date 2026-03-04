"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bot } from "lucide-react";

interface Assistant {
  id: string;
  business_id: string;
  name: string;
  role: string;
  status: string;
}

interface AssistantsListProps {
  assistants: Assistant[];
}

export function AssistantsList({ assistants }: AssistantsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Assistants ({assistants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assistants.length > 0 ? (
          <div className="space-y-4">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--night-lighter)]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--tropical-indigo)]/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-[var(--tropical-indigo)]" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--lavender)]">{assistant.name}</div>
                    <div className="text-sm text-[var(--lavender-muted)]">{assistant.role}</div>
                  </div>
                </div>
                <Badge variant={assistant.status === "active" ? "success" : "warning"}>
                  {assistant.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--lavender-muted)]">
            No assistants found for this business.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
