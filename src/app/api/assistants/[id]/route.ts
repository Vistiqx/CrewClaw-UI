import { NextRequest, NextResponse } from "next/server";
import { getAssistant, updateAssistant, deleteAssistant, type Channel, type AssistantStatus } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assistant = getAssistant(parseInt(id));
  
  if (!assistant) {
    return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
  }
  
  return NextResponse.json(assistant);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existing = getAssistant(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }
    
    if (body.channel) {
      const validChannels: Channel[] = ["telegram", "slack", "discord", "signal"];
      if (!validChannels.includes(body.channel)) {
        return NextResponse.json(
          { error: "Invalid channel" },
          { status: 400 }
        );
      }
    }
    
    if (body.channels) {
      const validChannels: Channel[] = ["telegram", "slack", "discord", "signal"];
      if (!Array.isArray(body.channels) || !body.channels.every((c: string) => validChannels.includes(c as Channel))) {
        return NextResponse.json(
          { error: "Invalid channels" },
          { status: 400 }
        );
      }
      // Convert channels array to JSON string for storage
      body.channels = JSON.stringify(body.channels);
    }
    
    if (body.status) {
      const validStatuses: AssistantStatus[] = ["running", "stopped", "error"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
    }
    
    const updated = updateAssistant(parseInt(id), body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteAssistant(parseInt(id));
  
  if (!deleted) {
    return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
  }
  
  return NextResponse.json({ success: true });
}
