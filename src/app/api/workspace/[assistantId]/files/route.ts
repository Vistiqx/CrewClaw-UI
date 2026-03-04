import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";

const WORKSPACE_BASE = "/opt/data/assistants";

async function getAssistantWorkspacePath(assistantId: string): Promise<string | null> {
  const db = getDb();
  const assistant = db.prepare("SELECT * FROM assistants WHERE id = ?").get(assistantId) as any;
  if (!assistant) return null;
  
  // Use business_id and assistant name to construct path
  const business = assistant.business_id;
  const assistantName = assistant.name;
  return path.join(WORKSPACE_BASE, business, assistantName, "workspace");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  const { assistantId } = await params;
  
  const workspaceDir = await getAssistantWorkspacePath(assistantId);
  if (!workspaceDir) {
    return NextResponse.json({ files: [] });
  }

  try {
    if (!fs.existsSync(workspaceDir)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(workspaceDir);
    const workspaceFiles = [
      "SOUL.md",
      "AGENTS.md",
      "IDENTITY.md",
      "MEMORY.md",
      "TOOLS.md",
      "HEARTBEAT.md",
      "USER.md",
    ];

    const availableFiles = workspaceFiles.filter((f) => files.includes(f));

    return NextResponse.json({ files: availableFiles });
  } catch {
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
