"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";

interface DailyUsageData {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

interface TokenUsageChartProps {
  data: DailyUsageData[] | undefined;
  isLoading: boolean;
}

export function TokenUsageChart({ data, isLoading }: TokenUsageChartProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-[var(--lavender)]">Token Usage Over Time</CardTitle>
        <CardDescription className="text-[var(--lavender-muted)]">
          Daily token consumption
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--tropical-indigo)]" />
          </div>
        ) : data?.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-[var(--lavender-muted)]">
            No data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                stroke="var(--lavender-muted)"
                fontSize={12}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis stroke="var(--lavender-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--night-light)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
                labelStyle={{ color: "var(--lavender)" }}
              />
              <Line
                type="monotone"
                dataKey="promptTokens"
                stroke="var(--tropical-indigo)"
                strokeWidth={2}
                name="Prompt Tokens"
              />
              <Line
                type="monotone"
                dataKey="completionTokens"
                stroke="var(--amethyst)"
                strokeWidth={2}
                name="Completion Tokens"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
