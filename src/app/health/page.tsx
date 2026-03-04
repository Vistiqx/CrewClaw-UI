"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Activity, Server, CheckCircle, XCircle, AlertCircle, Container } from "lucide-react";

interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: "running" | "stopped" | "error" | "paused" | "restarting" | "removing" | "exited" | "dead";
  created: number;
  cpuPercent: number;
  memoryPercent: number;
  memoryUsage: string;
  memoryLimit: string;
}

interface HealthOverview {
  total: number;
  running: number;
  stopped: number;
  error: number;
  dockerVersion: string | null;
  lastUpdated: string;
}

function getStatusVariant(state: ContainerInfo["state"]): "success" | "secondary" | "error" | "warning" | "info" {
  switch (state) {
    case "running":
      return "success";
    case "stopped":
    case "exited":
      return "secondary";
    case "error":
    case "dead":
      return "error";
    case "paused":
    case "restarting":
    case "removing":
      return "warning";
    default:
      return "secondary";
  }
}

function getUsageColor(percent: number): string {
  if (percent < 60) return "var(--success)";
  if (percent < 80) return "var(--warning)";
  return "var(--error)";
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastUpdated(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function HealthPage() {
  const [overview, setOverview] = useState<HealthOverview | null>(null);
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, containersRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/health/containers"),
      ]);

      const [overviewData, containersData] = await Promise.all([
        overviewRes.json(),
        containersRes.json(),
      ]);

      setOverview(overviewData);
      setContainers(containersData.error ? [] : containersData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--night)] p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-8 h-8 text-[var(--tropical-indigo)]" />
            <h1 className="text-3xl font-bold text-[var(--lavender)]">System Health</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-[var(--lavender-muted)]">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--night)] p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-8 h-8 text-[var(--tropical-indigo)]" />
          <h1 className="text-3xl font-bold text-[var(--lavender)]">System Health</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)] text-[var(--error)]">
            {error}
          </div>
        )}

        <div className="mb-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
                  Total Containers
                </CardTitle>
                <Container className="w-4 h-4 text-[var(--lavender-muted)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--lavender)]">
                  {overview?.total ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
                  Running
                </CardTitle>
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--success)]">
                  {overview?.running ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
                  Stopped
                </CardTitle>
                <XCircle className="w-4 h-4 text-[var(--dim-gray)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--lavender)]">
                  {overview?.stopped ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--lavender-muted)]">
                  Error
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-[var(--error)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--error)]">
                  {overview?.error ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-6 mt-4 text-sm text-[var(--lavender-muted)]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>Docker: {overview?.dockerVersion ?? "Unknown"}</span>
            </div>
            <div>
              Last updated: {overview?.lastUpdated ? formatLastUpdated(overview.lastUpdated) : "N/A"}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[var(--lavender)] mb-4">Container Status</h2>
          
          {containers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-[var(--lavender-muted)]">
                No crewclaw containers found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {containers.map((container) => (
                <Card key={container.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono">
                        {container.name}
                      </CardTitle>
                      <Badge variant={getStatusVariant(container.state)}>
                        {container.state}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <span className="text-[var(--lavender-muted)]">ID: </span>
                      <span className="font-mono text-[var(--lavender)]">{container.id}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[var(--lavender-muted)]">Image: </span>
                      <span className="text-[var(--lavender)]">{container.image}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[var(--lavender-muted)]">Status: </span>
                      <span className="text-[var(--lavender)]">{container.status}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[var(--lavender-muted)]">Created: </span>
                      <span className="text-[var(--lavender)]">{formatDate(container.created)}</span>
                    </div>

                    {container.state === "running" && (
                      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--lavender-muted)]">CPU</span>
                            <span className="text-[var(--lavender)]">{container.cpuPercent.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-[var(--night-lighter)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(container.cpuPercent, 100)}%`,
                                backgroundColor: getUsageColor(container.cpuPercent),
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--lavender-muted)]">Memory</span>
                            <span className="text-[var(--lavender)]">
                              {container.memoryUsage} / {container.memoryLimit}
                            </span>
                          </div>
                          <div className="h-2 bg-[var(--night-lighter)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(container.memoryPercent, 100)}%`,
                                backgroundColor: getUsageColor(container.memoryPercent),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
