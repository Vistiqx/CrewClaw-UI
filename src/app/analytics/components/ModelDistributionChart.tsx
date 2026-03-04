"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

const COLORS = ["#AC8FFEff", "#8A6FD6ff", "#4C3D75ff", "#4ADE80", "#FBBF24", "#F87171", "#60A5FA"];

interface ModelDistributionData {
  model: string;
  tokens: number;
  percentage: number;
}

interface ModelDistributionChartProps {
  data: ModelDistributionData[] | undefined;
  isLoading: boolean;
}

export function ModelDistributionChart({ data, isLoading }: ModelDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--lavender)]">Usage by Model</CardTitle>
        <CardDescription className="text-[var(--lavender-muted)]">
          Distribution across models
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
            <PieChart>
              <Pie
                data={data || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="tokens"
                nameKey="model"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {(data || []).map((entry, index) => (
                  <Cell
                    key={entry.model}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--night-light)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
                labelStyle={{ color: "var(--lavender)" }}
                formatter={(value) => formatNumber(Number(value) || 0)}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
