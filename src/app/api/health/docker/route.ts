import { NextResponse } from "next/server";

export async function GET() {
  try {
    const Docker = (await import("dockerode")).default;
    const docker = new Docker();
    const info = await docker.info();
    const version = await docker.version();

    return NextResponse.json({
      connected: true,
      version: version.Version || undefined,
      containersRunning: info.ContainersRunning || 0,
      containersPaused: info.ContainersPaused || 0,
      containersStopped: info.ContainersStopped || 0,
      images: info.Images || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        version: undefined,
        containersRunning: 0,
        containersPaused: 0,
        containersStopped: 0,
        images: 0,
        error: error instanceof Error ? error.message : "Failed to connect to Docker daemon",
      },
      { status: 200 }
    );
  }
}
