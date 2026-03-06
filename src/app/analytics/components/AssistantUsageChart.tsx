"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface AssistantUsageData {
  assistantId: string;
  assistantName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  percentage: number;
}

interface AssistantUsageChartProps {
  data: AssistantUsageData[] | undefined;
  isLoading: boolean;
}

export function AssistantUsageChart({ data, isLoading }: AssistantUsageChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--lavender)]">Per-Assistant Usage</CardTitle>
        <CardDescription className="text-[var(--lavender-muted)]">
          Token consumption by assistant
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--tropical-indigo)]" />
          </div>
        ) : data?.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-[var(--lavender-muted)]">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(data || []).slice(0, 5)}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--lavender-muted)" fontSize={12} />
              <YAxis
                type="category"
                dataKey="assistantName"
                stroke="var(--lavender-muted)"
                fontSize={12}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--night-light)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
                labelStyle={{ color: "var(--lavender)" }}
                formatter={(value) => formatNumber(Number(value) || 0)}
              />
              <Bar dataKey="totalTokens" fill="var(--tropical-indigo)" name="Tokens" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
