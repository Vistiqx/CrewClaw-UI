"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Gauge } from "@/components/ui/Gauge";
import { LogViewer } from "@/components/features/LogViewer";

interface SystemHealth {
  cpu: { utilization: number; cores: number };
  memory: { utilization: number; total: number; used: number; free: number };
  disk: { utilization: number };
  temperature: number | null;
  uptime: { formatted: string };
}

interface DashboardStats {
  totalBusinesses: number;
  totalAssistants: number;
  activeAssistants: number;
  activeToday: number;
}

interface TaskSummary {
  planning: number;
  inbox: number;
  assigned: number;
  in_progress: number;
  testing: number;
  review: number;
  done: number;
}

interface RunningAssistant {
  id: number;
  name: string;
  business_id: string;
  channel: string;
  status: string;
}

function getGaugeColor(value: number, thresholdWarning = 70, thresholdError = 90): "default" | "warning" | "error" {
  if (value >= thresholdError) return "error";
  if (value >= thresholdWarning) return "warning";
  return "default";
}

function StatGauge({ value, label, color = "default" }: { value: number; label: string; color?: "default" | "warning" | "error" | "success" | "info" }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <Gauge value={value} max={100} label={String(value)} color={color} unit="" />
      </div>
      <span className="text-xs text-[var(--lavender-muted)] text-center whitespace-nowrap mt-1">{label}</span>
    </div>
  );
}

function TaskGauge({ value, total, label, color = "default" }: { value: number; total: number; label: string; color?: "default" | "warning" | "error" | "success" | "info" }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14">
        <Gauge value={percentage} max={100} label={String(value)} color={color} unit="" />
      </div>
      <span className="text-xs text-[var(--lavender-muted)] text-center whitespace-nowrap mt-1">{label}</span>
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    totalAssistants: 0,
    activeAssistants: 0,
    activeToday: 0,
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [runningAssistants, setRunningAssistants] = useState<RunningAssistant[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<{id: string; name: string; prefix: string}[]>([]);

  // Create a mapping of business_id to business name
  const businessMap = businesses.reduce((acc, business) => {
    acc[business.id] = { name: business.name, prefix: business.prefix };
    return acc;
  }, {} as Record<string, { name: string; prefix: string }>);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bizRes, assistantsRes, overviewRes, healthRes, tasksRes, allAssistantsRes] = await Promise.all([
          fetch("/api/businesses"),
          fetch("/api/assistants?status=running"),
          fetch("/api/analytics/overview"),
          fetch("/api/health/system"),
          fetch("/api/tasks"),
          fetch("/api/assistants"),
        ]);

        const businessesData = await bizRes.json();
        const running = await assistantsRes.json();
        const overview = await overviewRes.json();
        const healthData = await healthRes.json();
        const tasksData = await tasksRes.json();
        const allAssistants = await allAssistantsRes.json();

        setBusinesses(businessesData);
        setStats({
          totalBusinesses: businessesData.length || 0,
          totalAssistants: allAssistants.length || 0,
          activeAssistants: running.length || 0,
          activeToday: overview.totalRuns || 0,
        });

        if (healthRes.ok) {
          setSystemHealth(healthData);
        }

        setRunningAssistants(running);
        
        if (tasksRes.ok) {
          const tasks = Array.isArray(tasksData) ? tasksData : [];
          const summary: TaskSummary = {
            planning: tasks.filter((t: any) => t.status === 'todo').length,
            inbox: 0,
            assigned: tasks.filter((t: any) => t.status === 'todo').length,
            in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
            testing: 0,
            review: tasks.filter((t: any) => t.status === 'review').length,
            done: tasks.filter((t: any) => t.status === 'done').length,
          };
          setTaskSummary(summary);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalTasks = taskSummary 
    ? taskSummary.planning + taskSummary.inbox + taskSummary.assigned + taskSummary.in_progress + taskSummary.testing + taskSummary.review + taskSummary.done 
    : 0;

  const cpuUtil = systemHealth?.cpu.utilization ?? 0;
  const memUtil = systemHealth?.memory.utilization ?? 0;
  const diskUtil = systemHealth?.disk.utilization ?? 0;

  return (
    <div className="space-y-6">
      <Card className="bg-night-light border border-border">
        <CardHeader>
          <CardTitle className="text-lavender">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="w-20 h-20">
              <Gauge 
                value={cpuUtil} 
                max={100} 
                label="CPU" 
                color={getGaugeColor(cpuUtil)}
              />
            </div>
            <div className="w-20 h-20">
              <Gauge 
                value={memUtil} 
                max={100} 
                label="RAM"
                color={getGaugeColor(memUtil)}
              />
            </div>
            <div className="w-20 h-20">
              <Gauge 
                value={diskUtil} 
                max={100} 
                label="Disk"
                color={getGaugeColor(diskUtil, 80, 95)}
              />
            </div>
            {systemHealth?.temperature && (
              <div className="w-20 h-20">
                <Gauge 
                  value={systemHealth.temperature} 
                  max={100} 
                  label="Temp"
                  color={getGaugeColor(systemHealth.temperature, 60, 80)}
                />
              </div>
            )}
            <div className="flex flex-col items-center justify-center w-24 px-2">
              <div className="text-base font-bold text-[var(--lavender)] text-center">
                {systemHealth?.uptime?.formatted || "..."}
              </div>
              <span className="mt-1 text-xs text-[var(--lavender-muted)]">Uptime</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-night-light border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lavender text-base">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-6">
              <StatGauge value={stats.totalBusinesses} label="Total Businesses" color={stats.totalBusinesses > 0 ? "success" : "default"} />
              <StatGauge value={stats.totalAssistants} label="Total Assistants" color={stats.totalAssistants > 0 ? "info" : "default"} />
              <StatGauge value={stats.activeAssistants} label="Running Assistants" color={stats.activeAssistants > 0 ? "success" : "default"} />
              <StatGauge value={stats.activeToday} label="Active Today" color={stats.activeToday > 0 ? "warning" : "default"} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-night-light border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lavender text-base">Task Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              {taskSummary && (
                <>
                  <TaskGauge value={taskSummary.inbox || 0} total={totalTasks} label="Inbox" color="default" />
                  <TaskGauge value={taskSummary.in_progress || 0} total={totalTasks} label="In Progress" color="warning" />
                  <TaskGauge value={taskSummary.review || 0} total={totalTasks} label="Review" color="info" />
                  <TaskGauge value={taskSummary.done || 0} total={totalTasks} label="Done" color="success" />
                </>
              )}
            </div>
            {totalTasks > 0 && (
              <div className="mt-3 h-3 bg-[var(--night-lighter)] rounded-full overflow-hidden flex">
                {taskSummary && (
                  <>
                    {taskSummary.planning > 0 && (
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${(taskSummary.planning / totalTasks) * 100}%` }}
                      />
                    )}
                    {taskSummary.inbox > 0 && (
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${(taskSummary.inbox / totalTasks) * 100}%` }}
                      />
                    )}
                    {taskSummary.assigned > 0 && (
                      <div 
                        className="bg-purple-500" 
                        style={{ width: `${(taskSummary.assigned / totalTasks) * 100}%` }}
                      />
                    )}
                    {taskSummary.in_progress > 0 && (
                      <div 
                        className="bg-orange-500" 
                        style={{ width: `${(taskSummary.in_progress / totalTasks) * 100}%` }}
                      />
                    )}
                    {taskSummary.testing > 0 && (
                      <div 
                        className="bg-pink-500" 
                        style={{ width: `${(taskSummary.testing / totalTasks) * 100}%` }}
                      />
                    )}
                    {taskSummary.review > 0 && (
                      <div 
                        className="bg-indigo-500" 
                        style={{ width: `${(taskSummary.review / totalTasks) * 100}%` }}
                      />
                    )}
                    {taskSummary.done > 0 && (
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(taskSummary.done / totalTasks) * 100}%` }}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-night-light border border-border">
          <CardHeader>
            <CardTitle className="text-lavender">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-[var(--lavender-muted)]">Loading...</div>
            ) : runningAssistants.length === 0 ? (
              <div className="text-center py-4 text-[var(--lavender-muted)]">No active sessions</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-2 px-4 text-[var(--lavender-muted)]">Name</th>
                      <th className="text-left py-2 px-4 text-[var(--lavender-muted)]">Business</th>
                      <th className="text-left py-2 px-4 text-[var(--lavender-muted)]">Channel</th>
                      <th className="text-left py-2 px-4 text-[var(--lavender-muted)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runningAssistants.map((assistant) => {
                      const businessInfo = businessMap[assistant.business_id];
                      const businessDisplayName = businessInfo ? `${businessInfo.prefix}-${businessInfo.name}` : assistant.business_id;
                      return (
                        <tr key={assistant.id} className="border-b border-[var(--border)]">
                          <td className="py-2 px-4 text-[var(--lavender)]">{assistant.name}</td>
                          <td className="py-2 px-4 text-[var(--lavender)]">{businessDisplayName}</td>
                          <td className="py-2 px-4 text-[var(--lavender)]">{assistant.channel}</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">
                              {assistant.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-night-light border border-border">
          <CardHeader>
            <CardTitle className="text-lavender">Live Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <LogViewer containerId="test" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
