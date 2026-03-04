import { NextRequest, NextResponse } from "next/server";
import { getPlugins, addPlugin, deletePlugin, getAllAssistants } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistant_id");
    
    const plugins = getPlugins(assistantId ? parseInt(assistantId) : undefined);
    const assistants = getAllAssistants();
    
    return NextResponse.json({ plugins, assistants });
  } catch (error) {
    console.error("Error fetching plugins:", error);
    return NextResponse.json({ error: "Failed to fetch plugins" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, content, file_path, assistant_id } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields: name, type" }, { status: 400 });
    }

    const plugin = addPlugin(name, description || null, type, content || null, file_path || null, assistant_id || null);

    return NextResponse.json(plugin);
  } catch (error) {
    console.error("Error adding plugin:", error);
    return NextResponse.json({ error: "Failed to add plugin" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const deleted = deletePlugin(id);

    if (!deleted) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plugin:", error);
    return NextResponse.json({ error: "Failed to delete plugin" }, { status: 500 });
  }
}
