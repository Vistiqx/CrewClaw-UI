import { NextResponse } from "next/server";
import { getDb, createAssistant, updateAssistant } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const businesses = db.prepare("SELECT * FROM businesses ORDER BY created_at DESC").all();
  return NextResponse.json(businesses);
}

async function deployContainer(assistant: any): Promise<string> {
  const { default: Docker } = await import("dockerode");
  const docker = new Docker();
  
  // Use assistant name, sanitized for Docker container naming
  const sanitizedName = assistant.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const containerName = `crewclaw-${sanitizedName}-${assistant.id}`;
  
  const existingContainers = await docker.listContainers({ all: true });
  const existing = existingContainers.find((c: { Names: string[] }) => 
    c.Names.some((n: string) => n === `/${containerName}`)
  );
  
  if (existing) {
    throw new Error(`Container ${containerName} already exists`);
  }
  
  const image = "crewclaw:local";
  
  try {
    const container = await docker.createContainer({
      Image: image,
      name: containerName,
      Env: [
        `ASSISTANT_ID=${assistant.id}`,
        `ASSISTANT_NAME=${assistant.name}`,
        `CHANNEL=${assistant.channel}`,
      ],
      Cmd: ["sleep", "infinity"],
    });
    
    await container.start();
    return container.id;
  } catch (error) {
    throw new Error(`Failed to deploy container: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, prefix, industry, description, timezone, business_type, create_assistants } = body;
  
  if (!name || !prefix) {
    return NextResponse.json(
      { error: "Name and prefix are required" },
      { status: 400 }
    );
  }
  
  const db = getDb();
  
  const now = new Date().toISOString();
  const businessId = `biz_${Date.now()}`;
  
  db.prepare(`
    INSERT INTO businesses (id, name, prefix, industry, description, timezone, status, business_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `).run(businessId, name, prefix, industry || null, description || null, timezone || "UTC", business_type || null, now, now);
  
  const business = db.prepare("SELECT * FROM businesses WHERE id = ?").get(businessId);

  const deployedAssistants = [];
  const failedAssistants = [];

  if (create_assistants && Array.isArray(create_assistants) && create_assistants.length > 0) {
    for (const assistantName of create_assistants) {
      try {
        const assistant = createAssistant({
          name: `${prefix}-${assistantName}`,
          business_id: businessId,
          channel: "telegram",
          role: "auto-created",
        });
        
        try {
          const containerId = await deployContainer(assistant);
          updateAssistant(assistant.id, { status: "running", container_id: containerId });
          deployedAssistants.push(assistant.name);
        } catch (deployError) {
          console.error(`Failed to deploy assistant ${assistant.name}:`, deployError);
          failedAssistants.push(assistant.name);
        }
      } catch (e) {
        console.error(`Failed to create assistant ${assistantName}:`, e);
      }
    }
  }
  
  return NextResponse.json({ 
    business, 
    deployed: deployedAssistants,
    failed: failedAssistants
  }, { status: 201 });
}
