import { NextRequest, NextResponse } from "next/server";
import { getAssistant, updateAssistant } from "@/lib/db";

export const dynamic = "force-dynamic";

async function restartContainer(containerName: string): Promise<void> {
  const { default: Docker } = await import("dockerode");
  const docker = new Docker();
  
  const containers = await docker.listContainers({ all: true });
  const container = containers.find((c: { Names: string[] }) => c.Names.some((n: string) => n === `/${containerName}`));
  
  if (!container) {
    throw new Error(`Container ${containerName} not found`);
  }
  
  const dockerContainer = docker.getContainer(container.Id);
  await dockerContainer.restart();
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
      await restartContainer(containerName);
      updateAssistant(parseInt(id), { status: "running" });
      
      return NextResponse.json({ success: true });
    } catch (dockerError) {
      updateAssistant(parseInt(id), { status: "error" });
      return NextResponse.json(
        { error: dockerError instanceof Error ? dockerError.message : "Failed to restart container" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to restart assistant" },
      { status: 500 }
    );
  }
}
