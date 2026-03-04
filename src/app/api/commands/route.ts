import { NextRequest, NextResponse } from "next/server";
import { getCommands, addCommand, deleteCommand, getAllAssistants } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistant_id");
    
    const commands = getCommands(assistantId ? parseInt(assistantId) : undefined);
    const assistants = getAllAssistants();
    
    return NextResponse.json({ commands, assistants });
  } catch (error) {
    console.error("Error fetching commands:", error);
    return NextResponse.json({ error: "Failed to fetch commands" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, content, file_path, assistant_id } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields: name, type" }, { status: 400 });
    }

    const command = addCommand(name, description || null, type, content || null, file_path || null, assistant_id || null);

    return NextResponse.json(command);
  } catch (error) {
    console.error("Error adding command:", error);
    return NextResponse.json({ error: "Failed to add command" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const deleted = deleteCommand(id);

    if (!deleted) {
      return NextResponse.json({ error: "Command not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting command:", error);
    return NextResponse.json({ error: "Failed to delete command" }, { status: 500 });
  }
}
