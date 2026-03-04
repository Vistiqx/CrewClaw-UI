"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Loader2 } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface AssistantUsageData {
  assistantId: string;
  assistantName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  percentage: number;
}

interface AssistantUsageTableProps {
  data: AssistantUsageData[] | undefined;
  isLoading: boolean;
}

export function AssistantUsageTable({ data, isLoading }: AssistantUsageTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--lavender)]">Assistant Usage Details</CardTitle>
        <CardDescription className="text-[var(--lavender-muted)]">
          Detailed breakdown by assistant
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--tropical-indigo)]" />
          </div>
        ) : data?.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-[var(--lavender-muted)]">
            No data available for this period
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[var(--lavender-muted)]">Assistant</TableHead>
                <TableHead className="text-right text-[var(--lavender-muted)]">
                  Prompt Tokens
                </TableHead>
                <TableHead className="text-right text-[var(--lavender-muted)]">
                  Completion Tokens
                </TableHead>
                <TableHead className="text-right text-[var(--lavender-muted)]">Total</TableHead>
                <TableHead className="text-right text-[var(--lavender-muted)]">Cost</TableHead>
                <TableHead className="text-right text-[var(--lavender-muted)]">
                  % of Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data || []).map((assistant) => (
                <TableRow key={assistant.assistantId}>
                  <TableCell className="font-medium text-[var(--lavender)]">
                    {assistant.assistantName}
                  </TableCell>
                  <TableCell className="text-right text-[var(--lavender)]">
                    {formatNumber(assistant.promptTokens)}
                  </TableCell>
                  <TableCell className="text-right text-[var(--lavender)]">
                    {formatNumber(assistant.completionTokens)}
                  </TableCell>
                  <TableCell className="text-right text-[var(--lavender)]">
                    {formatNumber(assistant.totalTokens)}
                  </TableCell>
                  <TableCell className="text-right text-[var(--lavender)]">
                    {formatCurrency(assistant.cost)}
                  </TableCell>
                  <TableCell className="text-right text-[var(--lavender-muted)]">
                    {assistant.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
