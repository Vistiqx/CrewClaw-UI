import { NextResponse } from "next/server";
import { getDb, createAssistant, updateAssistant, getBusinessById } from "@/lib/db";
import { generateContainerName, getAssistantBasePath } from "@/lib/path-utils";
import fs from "fs";
import path from "path";

export async function GET() {
  const db = getDb();
  const businesses = db.prepare("SELECT * FROM businesses ORDER BY created_at DESC").all();
  return NextResponse.json(businesses);
}

async function deployContainer(assistant: any): Promise<string> {
  const { default: Docker } = await import("dockerode");
  const docker = new Docker();
  
  // Get business info for proper container naming
  const business = getBusinessById(assistant.business_id);
  if (!business) {
    throw new Error("Business not found for assistant");
  }
  
  // Use the same naming convention as the deploy route
  const containerName = generateContainerName(business.prefix, assistant.name);
  
  // Create directory structure FIRST (before checking/deploying container)
  const assistantBasePath = getAssistantBasePath(business.prefix, business.name, assistant.name);
  const workspacePath = path.join(assistantBasePath, "workspace");
  const configPath = path.join(assistantBasePath, "config");
  const logsPath = path.join(assistantBasePath, "logs");
  
  [workspacePath, configPath, logsPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  console.log(`✓ Created directories for assistant: ${assistant.name} at ${assistantBasePath}`);
  
  // Check if container already exists
  const existingContainers = await docker.listContainers({ all: true });
  const existing = existingContainers.find((c: { Names: string[] }) => 
    c.Names.some((n: string) => n === `/${containerName}`)
  );
  
  if (existing) {
    console.log(`Container ${containerName} already exists, using existing container`);
    // If container exists but is stopped, try to start it
    if (!existing.State || existing.State.toLowerCase() !== 'running') {
      try {
        const container = docker.getContainer(existing.Id);
        await container.start();
        console.log(`Started existing container: ${containerName}`);
      } catch (startError) {
        console.warn(`Could not start existing container ${containerName}:`, startError);
      }
    }
    return existing.Id;
  }
  
  const image = "crewclaw:optimized";
  
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
    console.log(`Created and started new container: ${containerName}`);
    return container.id;
  } catch (error) {
    console.error(`Failed to deploy container ${containerName}:`, error);
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
