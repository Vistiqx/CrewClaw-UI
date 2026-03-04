import { NextRequest, NextResponse } from "next/server";
import { getAssistant, updateAssistant } from "@/lib/db";

export const dynamic = "force-dynamic";

async function startContainer(containerName: string): Promise<string> {
  const { default: Docker } = await import("dockerode");
  const docker = new Docker();
  
  const containers = await docker.listContainers({ all: true });
  const container = containers.find((c: { Names: string[] }) => c.Names.some((n: string) => n === `/${containerName}`));
  
  if (!container) {
    throw new Error(`Container ${containerName} not found`);
  }
  
  const dockerContainer = docker.getContainer(container.Id);
  
  if (container.State === "running") {
    return container.Id;
  }
  
  await dockerContainer.start();
  return container.Id;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assistant = getAssistant(parseInt(id));
    
    if (!assistant) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }
    
    const containerName = `crewclaw-${assistant.channel}-${assistant.id}`;
    
    try {
      const containerId = await startContainer(containerName);
      updateAssistant(parseInt(id), { status: "running", container_id: containerId });
      
      return NextResponse.json({ success: true, container_id: containerId });
    } catch (dockerError) {
      updateAssistant(parseInt(id), { status: "error" });
      return NextResponse.json(
        { error: dockerError instanceof Error ? dockerError.message : "Failed to start container" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to start assistant" },
      { status: 500 }
    );
  }
}
