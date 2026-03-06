import { NextResponse } from "next/server";
import fs from "fs";
import { getDb } from "@/lib/db";
import { getAssistantWorkspacePath } from "@/lib/path-utils";

async function getAssistantWorkspacePathFromDb(assistantId: string): Promise<string | null> {
  const db = getDb();
  const assistant = db.prepare("SELECT a.*, b.prefix as business_prefix, b.name as business_name FROM assistants a JOIN businesses b ON a.business_id = b.id WHERE a.id = ?").get(assistantId) as any;
  if (!assistant) return null;
  
  return getAssistantWorkspacePath(
    assistant.business_prefix,
    assistant.business_name,
    assistant.name
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  const { assistantId } = await params;
  
  const workspaceDir = await getAssistantWorkspacePathFromDb(assistantId);
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
