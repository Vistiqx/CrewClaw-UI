import { NextResponse } from "next/server";
import { getDocker, HealthOverview } from "@/lib/docker";

export async function GET() {
  try {
    const docker = getDocker();
    const containers = await docker.listContainers({ all: true });
    const version = await docker.version();

    const crewclawContainers = containers.filter((c) => {
      const name = c.Names[0]?.toLowerCase() || "";
      return name.includes("crewclaw") || name.includes("cc-");
    });

    const running = crewclawContainers.filter((c) => c.State === "running").length;
    const stopped = crewclawContainers.filter((c) => c.State === "exited").length;
    const errorCount = crewclawContainers.filter((c) => c.State === "dead" || c.State === "removing").length;

    const overview: HealthOverview = {
      total: crewclawContainers.length,
      running,
      stopped,
      error: errorCount,
      dockerVersion: version.Version || null,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(overview);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch health overview";
    return NextResponse.json(
      {
        total: 0,
        running: 0,
        stopped: 0,
        error: 0,
        dockerVersion: null,
        lastUpdated: new Date().toISOString(),
        errorMessage,
      },
      { status: 200 }
    );
  }
}
