import { NextRequest, NextResponse } from "next/server";
import {
  getAssistant,
  updateAssistant,
  getCredentialsByAssistantId,
  getBusinessById,
} from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { autoAssignIp, getIpByAssistantId } from "@/lib/network";
import { archiveAssistantVolume } from "@/lib/archive";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

// Generate container name from business prefix and assistant name
function generateContainerName(
  businessPrefix: string,
  assistantName: string
): string {
  // Sanitize assistant name: lowercase, replace non-alphanumeric with hyphens
  const sanitized = assistantName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${businessPrefix}-${sanitized}`;
}

async function ensureImageExists(docker: any): Promise<void> {
  const imageName = "crewclaw:optimized";

  try {
    // Check if image exists
    const images = await docker.listImages();
    const exists = images.some(
      (img: any) => img.RepoTags && img.RepoTags.includes(imageName)
    );

    if (exists) {
      console.log(`Image ${imageName} already exists`);
      return;
    }

    console.log(`Image ${imageName} not found, building...`);

    // Find the framework directory
    const possiblePaths = [
      "/opt/docker/assistants/_framework",
      "/opt/scripts/crewclaw-core/framework-templates",
      path.join(process.cwd(), "../../framework-templates"),
    ];

    let frameworkPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(path.join(p, "Dockerfile.CrewClaw"))) {
        frameworkPath = p;
        break;
      }
    }

    if (!frameworkPath) {
      throw new Error(
        "Dockerfile.CrewClaw not found. Please ensure framework is installed."
      );
    }

    // Build the image
    console.log(`Building image from ${frameworkPath}...`);
    const { stdout, stderr } = await execAsync(
      `docker build -f ${path.join(
        frameworkPath,
        "Dockerfile.CrewClaw"
      )} -t ${imageName} ${frameworkPath}`,
      { timeout: 300000 } // 5 minute timeout
    );

    if (stderr && !stderr.includes("Successfully built")) {
      console.error("Build stderr:", stderr);
    }

    console.log("Build stdout:", stdout);
    console.log(`✓ Image ${imageName} built successfully`);
  } catch (error) {
    console.error("Failed to build image:", error);
    throw new Error(
      `Failed to build ${imageName} image: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function writeCredentials(
  assistantId: number,
  configPath: string
): Promise<void> {
  // Write credential files for the assistant
  const credentials = getCredentialsByAssistantId(assistantId);

  for (const cred of credentials) {
    try {
      const decryptedValue = decrypt(Buffer.from(cred.encrypted_value));

      // Map credential types to file names
      const fileMap: { [key: string]: string } = {
        openrouter_api_key: "openrouter_api_key.txt",
        openai_api_key: "openai_api_key.txt",
        anthropic_api_key: "anthropic_api_key.txt",
        telegram_bot_token: "bot_token.txt",
        slack_bot_token: "bot_token.txt",
        discord_bot_token: "bot_token.txt",
        signal_token: "bot_token.txt",
      };

      const fileName = fileMap[cred.type];
      if (fileName) {
        const filePath = path.join(configPath, fileName);
        fs.writeFileSync(filePath, decryptedValue, { mode: 0o600 }); // Secure permissions
        console.log(`✓ Wrote credential file: ${fileName}`);
      }
    } catch (error) {
      console.error(`Failed to write credential ${cred.name}:`, error);
    }
  }
}

async function deployContainer(assistant: any): Promise<string> {
  const { default: Docker } = await import("dockerode");
  const docker = new Docker();

  // Ensure the image exists before deploying
  await ensureImageExists(docker);

  // Get business info for prefix
  const business = getBusinessById(assistant.business_id);
  if (!business) {
    throw new Error("Business not found");
  }

  // Validate business prefix (must be 3 characters)
  const businessPrefix = business.prefix;
  if (!businessPrefix || businessPrefix.length !== 3) {
    throw new Error(
      `Invalid business prefix: ${businessPrefix}. Must be exactly 3 characters.`
    );
  }

  // Generate container name: XXX-assistant-name
  const containerName = generateContainerName(businessPrefix, assistant.name);

  // Check if container already exists
  const existingContainers = await docker.listContainers({ all: true });
  const existing = existingContainers.find((c: { Names: string[] }) =>
    c.Names.some((n: string) => n === `/${containerName}`)
  );

  if (existing) {
    throw new Error(`Container ${containerName} already exists`);
  }

  // Use the optimized crewclaw image
  const image = "crewclaw:optimized";

  // Construct paths based on business prefix and assistant name
  const assistantsDataPath =
    process.env.ASSISTANTS_DATA_PATH || "/opt/data/crewclaw-assistants";
  const basePath = path.join(assistantsDataPath, containerName);
  const workspacePath = path.join(basePath, "workspace");
  const configPath = path.join(basePath, "config");
  const logsPath = path.join(basePath, "logs");

  // Ensure directories exist
  [workspacePath, configPath, logsPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Write credentials to config directory
  await writeCredentials(assistant.id, configPath);

  // Auto-assign IP address from pool
  const ipAddress = autoAssignIp(assistant.id);
  if (!ipAddress) {
    throw new Error(
      "No available IP addresses in pool. Please check network configuration."
    );
  }

  console.log(`✓ Assigned IP address: ${ipAddress} to container ${containerName}`);

  try {
    const container = await docker.createContainer({
      Image: image,
      name: containerName,
      Env: [
        `ASSISTANT_ID=${assistant.id}`,
        `ASSISTANT_NAME=${assistant.name}`,
        `BUSINESS_PREFIX=${businessPrefix}`,
        `BUSINESS_ID=${assistant.business_id}`,
        `CHANNEL=${assistant.channel}`,
        `ASSIGNED_IP=${ipAddress}`,
        `OPENROUTER_API_KEY_FILE=/config/openrouter_api_key.txt`,
        `BOT_TOKEN_FILE=/config/bot_token.txt`,
        `ENCRYPTION_KEY_FILE=/config/encryption_key.txt`,
      ],
      HostConfig: {
        NetworkMode: "assistant-network-internal", // Required MACVLAN network
        Binds: [
          `${workspacePath}:/workspace`,
          `${configPath}:/config`,
          `${logsPath}:/logs`,
        ],
        // Note: Privileged is NOT allowed - enforced by AuthZ plugin
      },
      NetworkingConfig: {
        EndpointsConfig: {
          "assistant-network-internal": {
            IPAMConfig: {
              IPv4Address: ipAddress,
            },
          },
        },
      },
      Cmd: ["sleep", "infinity"],
    });

    await container.start();
    
    // Get container details to verify IP assignment
    const containerInfo = await container.inspect();
    const assignedIP = containerInfo.NetworkSettings.Networks["assistant-network-internal"]?.IPAddress;
    
    console.log(`✓ Container ${containerName} deployed with IP: ${assignedIP || ipAddress}`);
    
    return container.id;
  } catch (error) {
    // If deployment fails, release the IP
    const db = require("@/lib/network");
    db.releaseIp(assistant.id);
    
    throw new Error(
      `Failed to deploy container: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
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

    // Check if assistant already has an IP assigned
    const existingIp = getIpByAssistantId(parseInt(id));
    if (existingIp) {
      console.log(`Assistant ${id} already has IP ${existingIp.ipAddress} assigned`);
    }

    try {
      const containerId = await deployContainer(assistant);
      
      // Get the business prefix for the container name
      const business = getBusinessById(parseInt(assistant.business_id as string));
      const containerName = generateContainerName(business?.prefix || "unk", assistant.name);
      
      updateAssistant(parseInt(id), { 
        status: "running", 
        container_id: containerId 
      });

      return NextResponse.json({ 
        success: true, 
        container_id: containerId,
        container_name: containerName,
        message: "Assistant deployed successfully with MACVLAN networking"
      });
    } catch (dockerError) {
      return NextResponse.json(
        {
          error:
            dockerError instanceof Error
              ? dockerError.message
              : "Failed to deploy container",
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to deploy assistant" },
      { status: 500 }
    );
  }
}
