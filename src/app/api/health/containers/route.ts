import { NextResponse } from "next/server";
import { getDocker } from "@/lib/docker";

interface ContainerResponse {
  id: string;
  name: string;
  image: string;
  status: string;
  state: "running" | "stopped" | "paused" | "restarting" | "removing" | "dead" | "error";
  created: number;
  cpuPercent: number;
  memoryPercent: number;
  memoryUsage: string;
  memoryLimit: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function mapState(state: string): "running" | "stopped" | "paused" | "restarting" | "removing" | "dead" | "error" {
  const stateMap: Record<string, "running" | "stopped" | "paused" | "restarting" | "removing" | "dead" | "error"> = {
    running: "running",
    exited: "stopped",
    paused: "paused",
    restarting: "restarting",
    removing: "removing",
    dead: "dead",
    created: "stopped",
  };
  return stateMap[state] || "error";
}

export async function GET() {
  try {
    const docker = getDocker();
    const containers = await docker.listContainers({ all: true });
    
    const crewclawContainers = containers.filter((c) => {
      const name = c.Names[0]?.toLowerCase() || "";
      return name.includes("crewclaw") || name.includes("cc-");
    });

    const containerInfos: ContainerResponse[] = await Promise.all(
      crewclawContainers.map(async (container) => {
        let cpuPercent = 0;
        let memoryPercent = 0;
        let memoryUsage = "0 B";
        let memoryLimit = "0 B";

        if (container.State === "running") {
          try {
            const stats = await docker.getContainer(container.Id).stats({ stream: false });
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
            const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
            const numCpus = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;
            
            if (systemCpuDelta > 0 && cpuDelta > 0) {
              cpuPercent = (cpuDelta / systemCpuDelta) * numCpus * 100;
            }

            const memUsage = stats.memory_stats.usage || 0;
            const memLimit = stats.memory_stats.limit || 1;
            memoryPercent = (memUsage / memLimit) * 100;
            memoryUsage = formatBytes(memUsage);
            memoryLimit = formatBytes(memLimit);
          } catch {
            cpuPercent = 0;
            memoryPercent = 0;
          }
        }

        return {
          id: container.Id.substring(0, 12),
          name: container.Names[0]?.replace(/^\//, "") || "unknown",
          image: container.Image || "unknown",
          status: container.Status || "unknown",
          state: mapState(container.State),
          created: container.Created,
          cpuPercent: Math.round(cpuPercent * 100) / 100,
          memoryPercent: Math.round(memoryPercent * 100) / 100,
          memoryUsage,
          memoryLimit,
        };
      })
    );

    return NextResponse.json(containerInfos);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch containers" },
      { status: 500 }
    );
  }
}
