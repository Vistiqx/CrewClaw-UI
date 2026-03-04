import { NextRequest, NextResponse } from "next/server";
import { getTools, addTool, deleteTool, getAllAssistants } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistant_id");
    
    const tools = getTools(assistantId ? parseInt(assistantId) : undefined);
    const assistants = getAllAssistants();
    
    return NextResponse.json({ tools, assistants });
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, content, file_path, assistant_id } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields: name, type" }, { status: 400 });
    }

    const tool = addTool(name, description || null, type, content || null, file_path || null, assistant_id || null);

    return NextResponse.json(tool);
  } catch (error) {
    console.error("Error adding tool:", error);
    return NextResponse.json({ error: "Failed to add tool" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const deleted = deleteTool(id);

    if (!deleted) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tool:", error);
    return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
  }
}
