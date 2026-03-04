"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatNumber, formatCurrency } from "@/lib/utils";

type Period = "today" | "week" | "month" | "year";

interface AnalyticsData {
  overview: {
    totalBusinesses: number;
    totalAssistants: number;
    activeAssistants: number;
    totalRuns: number;
  };
  assistantUsage: any[];
  dailyUsage: any[];
  modelDistribution: any[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [overviewRes, usageRes] = await Promise.all([
          fetch(`/api/analytics/overview?period=${period}`),
          fetch(`/api/analytics/usage?period=${period}`),
        ]);

        const overviewData = await overviewRes.json();
        const usageData = await usageRes.json();

        setData({ overview: overviewData, ...usageData });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--lavender)]">Analytics</h1>
        <div className="flex gap-2">
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-sm ${
                period === p
                  ? "bg-[var(--tropical-indigo)] text-[var(--night)]"
                  : "bg-[var(--night-lighter)] text-[var(--lavender)] hover:bg-[var(--night-lighter)]"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[var(--lavender-muted)]">Loading...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-night-light border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
                  Businesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--lavender)]">
                  {data?.overview?.totalBusinesses || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-night-light border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
                  Assistants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--lavender)]">
                  {data?.overview?.totalAssistants || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-night-light border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
                  Active Assistants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--success)]">
                  {data?.overview?.activeAssistants || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-night-light border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
                  Total Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--lavender)]">
                  {formatNumber(data?.overview?.totalRuns || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-night-light border-border">
              <CardHeader>
                <CardTitle className="text-[var(--lavender)]">Daily Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.dailyUsage?.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    {data!.dailyUsage!.slice(0, 7).map((day: any) => (
                      <div key={day.date} className="flex justify-between text-sm">
                        <span className="text-[var(--lavender-muted)]">{day.date}</span>
                        <span className="text-[var(--lavender)]">{formatNumber(day.runs || 0)} runs</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--lavender-muted)]">No usage data</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-night-light border-border">
              <CardHeader>
                <CardTitle className="text-[var(--lavender)]">Model Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.modelDistribution?.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    {data!.modelDistribution!.map((model: any) => (
                      <div key={model.model} className="flex justify-between text-sm">
                        <span className="text-[var(--lavender-muted)]">{model.model}</span>
                        <span className="text-[var(--lavender)]">{formatNumber(model.count || 0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--lavender-muted)]">No model data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
