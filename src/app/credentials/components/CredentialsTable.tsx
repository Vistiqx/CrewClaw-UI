"use client";

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
import { Trash2, Pencil } from "lucide-react";

type Credential = {
  id: number;
  assistant_id: number;
  type: string;
  name: string;
  masked_value: string;
  assistant_name: string;
  created_at: string;
};

const typeBadgeVariant: Record<string, "default" | "secondary" | "info" | "success" | "warning"> = {
  openrouter_api_key: "info",
  openai_api_key: "info",
  anthropic_api_key: "info",
  telegram_bot_token: "success",
  slack_bot_token: "success",
  discord_bot_token: "success",
  signal_token: "warning",
  api_key: "default",
  other: "secondary",
};

const typeLabels: Record<string, string> = {
  openrouter_api_key: "OpenRouter",
  openai_api_key: "OpenAI",
  anthropic_api_key: "Anthropic",
  telegram_bot_token: "Telegram",
  slack_bot_token: "Slack",
  discord_bot_token: "Discord",
  signal_token: "Signal",
  api_key: "API Key",
  other: "Other",
};

interface CredentialsTableProps {
  credentials: Credential[];
  onDelete: (credential: Credential) => void;
  onEdit: (credential: Credential) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CredentialsTable({ credentials, onDelete, onEdit }: CredentialsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-[var(--lavender-muted)]">Name</TableHead>
          <TableHead className="text-[var(--lavender-muted)]">Type</TableHead>
          <TableHead className="text-[var(--lavender-muted)]">Assistant</TableHead>
          <TableHead className="text-[var(--lavender-muted)]">Value</TableHead>
          <TableHead className="text-[var(--lavender-muted)]">Created</TableHead>
          <TableHead className="text-right text-[var(--lavender-muted)]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {credentials.map((credential) => (
          <TableRow key={credential.id}>
            <TableCell className="font-medium text-[var(--lavender)]">
              {credential.name}
            </TableCell>
            <TableCell>
              <Badge variant={typeBadgeVariant[credential.type] || "secondary"}>
                {typeLabels[credential.type] || credential.type.replace(/_/g, " ")}
              </Badge>
            </TableCell>
            <TableCell className="text-[var(--lavender)]">{credential.assistant_name}</TableCell>
            <TableCell className="font-mono text-[var(--lavender-muted)]">
              {credential.masked_value}
            </TableCell>
            <TableCell className="text-[var(--lavender-muted)]">
              {formatDate(credential.created_at)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(credential)}
                >
                  <Pencil className="h-4 w-4 text-[var(--tropical-indigo)]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(credential)}
                >
                  <Trash2 className="h-4 w-4 text-[var(--error)]" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
