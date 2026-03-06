import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
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
  { params }: { params: Promise<{ assistantId: string; name: string }> }
) {
  const { assistantId, name } = await params;
  
  const workspaceDir = await getAssistantWorkspacePathFromDb(assistantId);
  if (!workspaceDir) {
    return NextResponse.json(
      { error: "Assistant not found" },
      { status: 404 }
    );
  }
  
  const filePath = path.join(workspaceDir, name);

  try {
    // Create workspace directory if it doesn't exist
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }
    
    // Return empty content for new files
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ content: "", name });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content, name });
  } catch (error) {
    console.error("Failed to read file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ assistantId: string; name: string }> }
) {
  const { assistantId, name } = await params;
  
  const workspaceDir = await getAssistantWorkspacePathFromDb(assistantId);
  if (!workspaceDir) {
    return NextResponse.json(
      { error: "Assistant not found" },
      { status: 404 }
    );
  }
  
  const filePath = path.join(workspaceDir, name);

  try {
    // Create workspace directory if it doesn't exist
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }

    const body = await request.json();
    const { content } = body;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ success: true, name });
  } catch (error) {
    console.error("Failed to save file:", error);
    return NextResponse.json(
      { error: "Failed to save file" },
      { status: 500 }
    );
  }
}
